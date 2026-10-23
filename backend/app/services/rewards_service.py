# app/services/rewards_service.py
from datetime import datetime, timedelta
from app import db
from app.models.rewards import (
    TierConfig, ChamaSubscription, Reward, PointLot,
    PointLedgerEntry, RewardRedemption,
)

INACTIVITY_DAYS = 365
POINT_LOT_DAYS = 365
TRIAL_DAYS = 14
POINTS_PER_KSH = 0.5


# ------------------------------------------------------------------ seeding
def seed_tiers_if_empty():
    if TierConfig.query.count() > 0:
        return
    rows = [
        ('Starter',  0,  500,   10,  1.0, 1000),
        ('Growth',   1, 1000,   50,  1.0, 2000),
        ('Business', 2, 2000,  150,  1.0, 4000),
        ('Gold',     3, 3000,  250,  1.0, 6000),
    ]
    for name, rank, price, max_m, mult, cap in rows:
        db.session.add(TierConfig(
            name=name, rank=rank, price_ksh=price, max_members=max_m,
            points_multiplier=mult, annual_redeem_cap=cap,
        ))
    db.session.commit()


def seed_rewards_if_empty():
    if Reward.query.count() > 0:
        return
    rows = [
        ('badge',     'BadgeCheck', 'Active Chama Badge',          'Shown on your group profile and monthly statements.', 100,  0,   10),
        ('tpl',       'FileText',   'Template Pack',               'Constitution, minutes and loan-agreement templates.',  300,  0,   20),
        ('trial',     'Sparkles',   '7-Day Premium Trial',         'Unlock Silver features for 7 days.',                  500,  0,   30),
        ('credit100', 'Ticket',     'KSh 100 Subscription Credit', 'Applied to your next invoice. Not cash.',            1000, 100, 40),
        ('credit250', 'Ticket',     'KSh 250 Subscription Credit', 'Applied to your next invoice. Not cash.',            2500, 250, 50),
        ('credit500', 'Gift',       'KSh 500 Subscription Credit', 'Equivalent to one free Bronze month.',               5000, 500, 60),
    ]
    for rid, icon, name, desc, pts, cash, order in rows:
        db.session.add(Reward(
            id=rid, icon=icon, name=name, description=desc,
            points_cost=pts, cash_value_ksh=cash, sort_order=order,
        ))
    db.session.commit()


# ------------------------------------------------------------------ tiers
def get_or_create_subscription(chama_id, default_tier='Starter'):
    sub = ChamaSubscription.query.filter_by(chama_id=chama_id).first()
    if sub:
        return sub
    sub = ChamaSubscription(chama_id=chama_id, base_tier=default_tier)
    db.session.add(sub)
    db.session.commit()
    return sub


def effective_tier(sub):
    if sub.trial_expires_at and datetime.utcnow() < sub.trial_expires_at:
        return 'Gold'
    return sub.base_tier


def tier_config(name):
    return TierConfig.query.get(name) or TierConfig.query.get('Starter')


# ------------------------------------------------------------------ points
def _balance(chama_id) -> int:
    total = db.session.query(db.func.coalesce(db.func.sum(PointLot.amount), 0)) \
        .filter(PointLot.chama_id == chama_id).scalar()
    return int(total or 0)


def _last_activity(chama_id):
    entry = (
        PointLedgerEntry.query
        .filter_by(chama_id=chama_id, event='grant')
        .order_by(PointLedgerEntry.created_at.desc())
        .first()
    )
    return entry.created_at if entry else None


def sweep_expired(chama_id):
    now = datetime.utcnow()
    expired = PointLot.query.filter(
        PointLot.chama_id == chama_id,
        PointLot.expires_at <= now,
        PointLot.amount > 0,
    ).all()
    if not expired:
        return

    last = _last_activity(chama_id)
    if last and (now - last) > timedelta(days=INACTIVITY_DAYS):
        total = sum(l.amount for l in expired)
        for lot in expired:
            lot.amount = 0
        if total > 0:
            db.session.add(PointLedgerEntry(
                chama_id=chama_id, event='expiry', points=-total,
                note=f'{INACTIVITY_DAYS} days inactive — all points expired',
            ))
        db.session.commit()
        return

    total = 0
    for lot in expired:
        total += lot.amount
        lot.amount = 0
    if total > 0:
        db.session.add(PointLedgerEntry(
            chama_id=chama_id, event='expiry', points=-total,
            note='Batches older than 12 months expired',
        ))
    db.session.commit()


def grant_points(chama_id, event, raw_amount, note, idempotency_key=None):
    if idempotency_key:
        exists = PointLedgerEntry.query.filter_by(
            idempotency_key=idempotency_key
        ).first()
        if exists:
            return {'granted': 0, 'balance': _balance(chama_id), 'duplicate': True}

    sub = get_or_create_subscription(chama_id)
    tier = effective_tier(sub)
    cfg = tier_config(tier)
    multiplier = cfg.points_multiplier or 1.0
    final = int(round(raw_amount * multiplier))
    if final <= 0:
        return {'granted': 0, 'balance': _balance(chama_id), 'duplicate': False}

    now = datetime.utcnow()
    db.session.add(PointLot(
        chama_id=chama_id,
        amount=final,
        expires_at=now + timedelta(days=POINT_LOT_DAYS),
    ))
    db.session.add(PointLedgerEntry(
        chama_id=chama_id, event='grant', points=final, note=note,
        idempotency_key=idempotency_key,
    ))
    db.session.commit()
    return {'granted': final, 'balance': _balance(chama_id), 'duplicate': False}


def redeem_reward(chama_id, reward_id):
    sweep_expired(chama_id)

    reward = Reward.query.get(reward_id)
    if not reward or not reward.active:
        return {'ok': False, 'reason': 'Unknown reward'}

    sub = get_or_create_subscription(chama_id)
    base_cfg = tier_config(sub.base_tier)
    if base_cfg.annual_redeem_cap == 0:
        return {'ok': False, 'reason': 'Free groups cannot redeem. Upgrade first.'}

    now = datetime.utcnow()
    year_start = datetime(now.year, 1, 1)
    year_end = datetime(now.year + 1, 1, 1)
    redeemed_this_year = db.session.query(
        db.func.coalesce(db.func.sum(-PointLedgerEntry.points), 0)
    ).filter(
        PointLedgerEntry.chama_id == chama_id,
        PointLedgerEntry.event == 'redeem',
        PointLedgerEntry.created_at >= year_start,
        PointLedgerEntry.created_at < year_end,
    ).scalar() or 0

    if redeemed_this_year + reward.points_cost > base_cfg.annual_redeem_cap:
        room = max(0, base_cfg.annual_redeem_cap - int(redeemed_this_year))
        return {
            'ok': False,
            'reason': (
                f"Annual cap for {sub.base_tier} is "
                f"{base_cfg.annual_redeem_cap} pts ({room} left)"
            ),
        }

    if _balance(chama_id) < reward.points_cost:
        return {'ok': False, 'reason': 'Not enough points'}

    needed = reward.points_cost
    lots = (
        PointLot.query
        .filter(PointLot.chama_id == chama_id, PointLot.amount > 0)
        .order_by(PointLot.expires_at.asc())
        .all()
    )
    for lot in lots:
        if needed <= 0:
            break
        take = min(lot.amount, needed)
        lot.amount -= take
        needed -= take

    count = RewardRedemption.query.filter_by(chama_id=chama_id).count() + 1
    code = f"CHM-{1000 + count}-{reward.id.upper()}"

    redemption = RewardRedemption(
        chama_id=chama_id,
        reward_id=reward.id,
        points_spent=reward.points_cost,
        code=code,
    )
    db.session.add(redemption)
    db.session.add(PointLedgerEntry(
        chama_id=chama_id, event='redeem', points=-reward.points_cost,
        note=f'{reward.name} · {code}', reward_id=reward.id,
    ))
    db.session.commit()

    return {
        'ok': True,
        'code': code,
        'reward': {
            'id': reward.id, 'name': reward.name,
            'pts': reward.points_cost, 'cashKsh': reward.cash_value_ksh,
        },
        'balance': _balance(chama_id),
    }


def get_points_state(chama_id):
    sweep_expired(chama_id)
    sub = get_or_create_subscription(chama_id)
    tier = effective_tier(sub)
    cfg = tier_config(tier)
    base_cfg = tier_config(sub.base_tier)

    balance = _balance(chama_id)

    now = datetime.utcnow()
    year_start = datetime(now.year, 1, 1)
    year_end = datetime(now.year + 1, 1, 1)
    redeemed_this_year = int(db.session.query(
        db.func.coalesce(db.func.sum(-PointLedgerEntry.points), 0)
    ).filter(
        PointLedgerEntry.chama_id == chama_id,
        PointLedgerEntry.event == 'redeem',
        PointLedgerEntry.created_at >= year_start,
        PointLedgerEntry.created_at < year_end,
    ).scalar() or 0)

    ledger_rows = (
        PointLedgerEntry.query
        .filter_by(chama_id=chama_id)
        .order_by(PointLedgerEntry.created_at.desc())
        .limit(40).all()
    )

    lots_rows = (
        PointLot.query
        .filter(PointLot.chama_id == chama_id, PointLot.amount > 0)
        .order_by(PointLot.expires_at.asc()).all()
    )

    redemptions = (
        RewardRedemption.query
        .filter_by(chama_id=chama_id)
        .order_by(RewardRedemption.created_at.desc())
        .limit(20).all()
    )

    return {
        'balance': balance,
        'redeemedThisYear': redeemed_this_year,
        'tier': tier,
        'baseTier': sub.base_tier,
        'trialExpiresAt': sub.trial_expires_at.isoformat() if sub.trial_expires_at else None,
        'isTrial': bool(sub.trial_expires_at and now < sub.trial_expires_at),
        'config': {
            'rank': cfg.rank,
            'price': cfg.price_ksh,
            'maxMembers': cfg.max_members,
            'pointsMultiplier': cfg.points_multiplier,
            'annualRedeemCap': cfg.annual_redeem_cap,
        },
        'baseConfig': {
            'annualRedeemCap': base_cfg.annual_redeem_cap,
            'price': base_cfg.price_ksh,
        },
        'lots': [
            {'amount': l.amount, 'expiresAt': l.expires_at.isoformat()}
            for l in lots_rows
        ],
        'ledger': [
            {
                'id': e.id,
                't': e.created_at.isoformat(),
                'ev': e.event,
                'pts': e.points,
                'note': e.note,
            }
            for e in ledger_rows
        ],
        'redemptions': [
            {
                'id': r.id,
                'rewardId': r.reward_id,
                'rewardName': r.reward.name if r.reward else r.reward_id,
                'code': r.code,
                'pointsSpent': r.points_spent,
                'createdAt': r.created_at.isoformat(),
            }
            for r in redemptions
        ],
    }


def list_rewards():
    rows = Reward.query.filter_by(active=True).order_by(Reward.sort_order).all()
    return [
        {
            'id': r.id, 'icon': r.icon, 'name': r.name,
            'desc': r.description, 'pts': r.points_cost,
            'cashKsh': r.cash_value_ksh,
        }
        for r in rows
    ]


def list_tiers():
    rows = TierConfig.query.order_by(TierConfig.rank).all()
    return [
        {
            'name': t.name, 'rank': t.rank, 'price': t.price_ksh,
            'maxMembers': t.max_members,
            'pointsMultiplier': t.points_multiplier,
            'annualRedeemCap': t.annual_redeem_cap,
        }
        for t in rows
    ]


def set_base_tier(chama_id, tier_name):
    cfg = TierConfig.query.get(tier_name)
    if not cfg:
        raise ValueError(f'Unknown tier: {tier_name}')
    sub = get_or_create_subscription(chama_id)
    sub.base_tier = tier_name
    db.session.commit()
    return sub


def start_trial(chama_id):
    sub = get_or_create_subscription(chama_id)
    sub.trial_expires_at = datetime.utcnow() + timedelta(days=TRIAL_DAYS)
    db.session.commit()
    return sub


def upgrade_tier(chama_id, tier_name):
    cfg = TierConfig.query.get(tier_name)
    if not cfg:
        raise ValueError(f'Unknown tier: {tier_name}')
    sub = get_or_create_subscription(chama_id)
    sub.base_tier = tier_name
    sub.trial_expires_at = None
    db.session.commit()
    return sub


def emit_event(chama_id, event_type, payload):
    if event_type == 'subscription_paid':
        if not payload.get('onTime'):
            return
        ym = datetime.utcnow().strftime('%Y-%m')
        ksh = float(payload.get('amountKsh') or 0)
        grant_points(
            chama_id, event_type, int(ksh * POINTS_PER_KSH),
            f"Paid KSh {int(ksh):,}",
            idempotency_key=f'pay:{chama_id}:{ym}',
        )
        return

    if event_type == 'tier_upgraded':
        to = payload.get('to')
        grant_points(
            chama_id, event_type, 500,
            f"Upgraded to {to}",
            idempotency_key=f'up:{chama_id}:{to}',
        )
        return

    if event_type == 'annual_prepay':
        y = datetime.utcnow().year
        grant_points(
            chama_id, event_type, 1000, 'Annual subscription prepaid',
            idempotency_key=f'annual:{chama_id}:{y}',
        )
        return

    if event_type == 'referral_paid':
        phone = payload.get('phone') or '—'
        grant_points(
            chama_id, event_type, 2000, f'Referral paid: {phone}',
            idempotency_key=f'ref:{chama_id}:{phone}:{datetime.utcnow().date()}',
        )
        return