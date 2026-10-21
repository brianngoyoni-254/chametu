import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Users,
  Star,
  Gift,
  Layers,
  Wallet,
  Receipt,
  Percent,
  PiggyBank,
  ArrowLeftRight,
  Heart,
  TrendingUp,
  Building2,
  RefreshCw,
  CalendarDays,
  Vote,
  ShieldCheck,
  FileText,
  BarChart3,
  X,
  LogOut,
  Pencil,
  LifeBuoy,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTier } from "../context/TierContext";
import { useChama } from "../context/ChamaContext";
import { useAuth } from "../context/AuthContext";
import { ROUTE_PERMISSIONS, ROUTE_TIERS, tierAtLeast } from "../lib/permissions";
import logo from "../assets/logos.png";
import ProfileModal from "./ProfileModal";

const SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/dashboard/invite", icon: Mail, label: "Invite Members" },
      { to: "/dashboard/chama", icon: Users, label: "My Chama" },
      { to: "/dashboard/support", icon: LifeBuoy, label: "Support" },
      { to: "/dashboard/settings", icon: SettingsIcon, label: "Settings" },
    ],
  },
  {
    label: "Rewards & Insights",
    items: [
      { to: "/rewards/points", icon: Star, label: "Chametu Points", badge: "NEW" },
      { to: "/rewards", icon: Gift, label: "Rewards Marketplace" },
      { to: "/rewards/plans", icon: Layers, label: "Plans & Rewards" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/dashboard/payments", icon: Wallet, label: "Payments Tracker" },
      { to: "/dashboard/transactions", icon: Receipt, label: "Transactions" },
      { to: "/dashboard/contributions", icon: Percent, label: "Contributions" },
      { to: "/dashboard/savings", icon: PiggyBank, label: "Savings" },
      { to: "/dashboard/loans", icon: ArrowLeftRight, label: "Loans" },
      { to: "/dashboard/welfare", icon: Heart, label: "Welfare" },
    ],
  },
  {
    label: "Investments",
    items: [
      { to: "/dashboard/portfolio", icon: TrendingUp, label: "Portfolio" },
      { to: "/dashboard/assets", icon: Building2, label: "Assets" },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/dashboard/payouts", icon: RefreshCw, label: "Payout Rotation" },
      { to: "/dashboard/meetings", icon: CalendarDays, label: "Meetings" },
      { to: "/dashboard/voting", icon: Vote, label: "Voting" },
    ],
  },
  {
    label: "People & Reports",
    items: [
      { to: "/dashboard/members", icon: Users, label: "Members" },
      { to: "/dashboard/roles", icon: ShieldCheck, label: "Roles & Permissions" },
      { to: "/dashboard/statements", icon: FileText, label: "Statements" },
      { to: "/dashboard/reports", icon: BarChart3, label: "Reports" },
    ],
  },
];

function initials(name) {
  if (!name) return "··";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ member, size = "md" }) {
  const dim =
    size === "lg" ? "w-11 h-11 text-[0.9rem]" : "w-8 h-8 text-[0.7rem]";
  if (member?.avatar) {
    return (
      <img
        src={member.avatar}
        alt={member.name}
        className={`${dim} rounded-lg object-cover shrink-0 border border-white/10`}
      />
    );
  }
  return (
    <span
      className={`${dim} rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold shrink-0`}
    >
      {initials(member?.name)}
    </span>
  );
}

export default function Sidebar({ open, onClose }) {
  const { tier, config, isTrial } = useTier();
  const { can, currentMember, updateCurrentMember } = useChama();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const perm = ROUTE_PERMISSIONS[item.to];
      if (perm !== undefined && perm !== null && !can(perm)) return false;
      const minTier = ROUTE_TIERS[item.to];
      if (minTier && !tierAtLeast(tier, minTier)) return false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Could not log out. Try again.");
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 hero:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed hero:sticky hero:top-0 hero:h-screen z-50
          w-[250px] flex flex-col gap-1 p-4
          bg-gradient-to-b from-[#0B1F33] to-[#0A2A2E] text-white
          overflow-y-auto transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full hero:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-2.5 pb-6 pt-1.5">
          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Chametu"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <span className="font-display font-bold text-[0.98rem]">
              Chametu
            </span>
          </div>
          <button
            onClick={onClose}
            className="hero:hidden text-white/60 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {visibleSections.map((section) => (
          <div key={section.label}>
            <div className="text-[0.68rem] tracking-wider text-white/40 font-semibold mt-3.5 mb-1.5 px-2.5">
              {section.label.toUpperCase()}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/rewards" || item.to === "/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.88rem] font-medium transition
                  ${
                    isActive
                      ? "bg-emerald/15 text-[#7CF0C0] font-semibold before:absolute before:-left-3.5 before:top-2 before:bottom-2 before:w-[3px] before:rounded before:bg-emerald"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <item.icon
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 opacity-85"
                />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[0.6rem] font-bold bg-gold text-[#3A2A00] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="mt-auto pt-3.5 px-2.5 border-t border-white/10 flex flex-col gap-3">
          <div className="text-[0.72rem] text-white/40">
            <b className="text-gold font-display">{tier}</b> plan
            {isTrial ? " · trial" : ""} · up to{" "}
            <b className="text-gold font-display">{config.maxMembers}</b>{" "}
            members
          </div>

          {currentMember && (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="group flex items-center gap-2.5 w-full p-1.5 -m-1.5 rounded-xl text-left hover:bg-white/5 transition"
              aria-label="Edit profile"
            >
              <Avatar member={currentMember} />
              <div className="min-w-0 flex-1">
                <div className="text-[0.82rem] font-semibold text-white truncate">
                  {currentMember.name}
                </div>
                <div className="text-[0.7rem] text-white/40 truncate">
                  {currentMember.role}
                </div>
              </div>
              <Pencil
                size={13}
                strokeWidth={2}
                className="text-white/30 group-hover:text-white/70 transition shrink-0"
              />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[0.86rem] font-medium text-white/70 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={15} strokeWidth={2} className="shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        member={currentMember}
        onSave={(patch) => {
          updateCurrentMember(patch);
          setProfileOpen(false);
          toast.success("Profile updated");
        }}
      />
    </>
  );
}