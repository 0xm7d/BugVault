import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStats, listVulnerabilities, updateProfile, updatePassword, listUsers, updateUserRole, getTrends } from "../api/client";
import { SeverityPill, StatusPill } from "../components/StatusBadge";

export default function DashboardPage({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const { data: statsData } = useQuery({ queryKey: ["stats"], queryFn: getStats });
  const { data: bugsData } = useQuery({ 
    queryKey: ["vulnerabilities"], 
    queryFn: () => listVulnerabilities(),
    refetchInterval: 5000 // Refresh every 5 seconds to see new bugs
  });
  const [trendsRange, setTrendsRange] = useState("month");
  const { data: trendsData } = useQuery({ 
    queryKey: ["trends", trendsRange], 
    queryFn: () => getTrends(trendsRange)
  });
  const { data: usersData } = useQuery({ 
    queryKey: ["users"], 
    queryFn: listUsers,
    enabled: user?.role === "admin" || user?.role === "owner" // Only fetch for admin/owner
  });

  const profileMutation = useMutation({
    mutationFn: () => updateProfile(profileForm.name),
    onSuccess: (data) => {
      onUserUpdate(data);
      setProfileSuccess("Profile updated successfully!");
      setProfileError(null);
      setTimeout(() => {
        setShowProfileForm(false);
        setProfileSuccess(null);
      }, 2000);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => {
      setProfileError(err.response?.data?.error || "Failed to update profile");
      setProfileSuccess(null);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("New passwords do not match");
      }
      return updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
    },
    onSuccess: () => {
      setPasswordSuccess("Password updated successfully!");
      setPasswordError(null);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(null);
      }, 2000);
    },
    onError: (err) => {
      setPasswordError(err.response?.data?.error || err.message || "Failed to update password");
      setPasswordSuccess(null);
    },
  });

  const total = statsData?.total ?? 0;
  const openCount = count(statsData?.byStatus, "open");
  const inReviewCount = count(statsData?.byStatus, "in_review");
  const fixedCount = count(statsData?.byStatus, "fixed");
  const closedCount = count(statsData?.byStatus, "closed");
  const criticalCount = count(statsData?.bySeverity, "critical");
  const highCount = count(statsData?.bySeverity, "high");
  const mediumCount = count(statsData?.bySeverity, "medium");
  const lowCount = count(statsData?.bySeverity, "low");

  const openProgress = total > 0 ? Math.round((openCount / total) * 100) : 0;
  const inReviewProgress = total > 0 ? Math.round((inReviewCount / total) * 100) : 0;
  const fixedProgress = total > 0 ? Math.round((fixedCount / total) * 100) : 0;
  const criticalProgress = total > 0 ? Math.round((criticalCount / total) * 100) : 0;

  const recentBugs = bugsData?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to BugVault{user?.role === "admin" ? " (Admin)" : user?.role === "owner" ? " (Owner)" : ""}
            </h1>
            <p className="text-blue-100 text-lg">
              {(user?.role === "admin" || user?.role === "owner")
                ? "Admin Dashboard - Manage vulnerabilities, view statistics, and control the platform."
                : "Create and track security vulnerabilities. You can create bugs and edit your own bugs."}
            </p>
          </div>
          <Link
            to="/bugs/new"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Add New Bug
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Open Vulnerabilities"
          value={openCount}
          progress={openProgress}
          color="text-red-600"
          bgColor="bg-red-50"
          progressColor="bg-red-500"
        />
        <MetricCard
          label="In Review"
          value={inReviewCount}
          progress={inReviewProgress}
          color="text-amber-600"
          bgColor="bg-amber-50"
          progressColor="bg-amber-500"
        />
        <MetricCard
          label="Fixed Issues"
          value={fixedCount}
          progress={fixedProgress}
          color="text-green-600"
          bgColor="bg-green-50"
          progressColor="bg-green-500"
        />
        <MetricCard
          label="Critical Severity"
          value={criticalCount}
          progress={criticalProgress}
          color="text-purple-600"
          bgColor="bg-purple-50"
          progressColor="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerability Trends */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vulnerability Trends</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTrendsRange("today")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  trendsRange === "today"
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTrendsRange("week")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  trendsRange === "week"
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTrendsRange("lastWeek")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  trendsRange === "lastWeek"
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setTrendsRange("month")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  trendsRange === "month"
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Last Month
              </button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-1">
            {trendsData?.data && trendsData.data.length > 0 ? (
              trendsData.data.map((item, i) => {
                const maxCount = Math.max(...trendsData.data.map(t => t.value), 1);
                const height = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${item.label}: ${item.value} bug${item.value !== 1 ? 's' : ''}`}
                    ></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center truncate w-full" title={item.label}>
                      {trendsRange === "today" ? item.label.split(':')[0] : item.label}
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback if no data
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No data available for this time range</p>
              </div>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Severity Distribution</h2>
          <div className="space-y-4">
            <SeverityBar label="Critical" value={criticalCount} total={total} color="bg-red-500" />
            <SeverityBar label="High" value={highCount} total={total} color="bg-orange-500" />
            <SeverityBar label="Medium" value={mediumCount} total={total} color="bg-amber-500" />
            <SeverityBar label="Low" value={lowCount} total={total} color="bg-green-500" />
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="Open Issues"
          value={openCount}
          percentage={openProgress}
          color="text-red-600"
          bgColor="bg-red-50"
          borderColor="border-red-200"
        />
        <StatusCard
          title="In Review"
          value={inReviewCount}
          percentage={inReviewProgress}
          color="text-amber-600"
          bgColor="bg-amber-50"
          borderColor="border-amber-200"
        />
        <StatusCard
          title="Resolved"
          value={fixedCount + closedCount}
          percentage={Math.round(((fixedCount + closedCount) / (total || 1)) * 100)}
          color="text-green-600"
          bgColor="bg-green-50"
          borderColor="border-green-200"
        />
      </div>

      {/* Recent Bugs Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bugs</h2>
          <Link
            to="/bugs"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {recentBugs.length > 0 ? (
          <div className="space-y-3">
            {recentBugs.map((bug) => (
              <div
                key={bug._id}
                onClick={() => navigate(`/bugs/${bug._id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{bug.title}</h3>
                  <div className="flex items-center gap-3">
                    <SeverityPill severity={bug.severity} />
                    <StatusPill status={bug.status} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{(user?.role === "admin" || user?.role === "owner") ? "No bugs yet. Create the first one!" : "No bugs reported yet."}</p>
          </div>
        )}
      </div>


      {/* Admin/Owner User Management Section */}
      {(user?.role === "admin" || user?.role === "owner") && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">User Management</h2>
          
          {usersData && usersData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map((u) => (
                    <UserRow 
                      key={u._id} 
                      user={u} 
                      currentUser={user}
                      onRoleUpdate={() => qc.invalidateQueries({ queryKey: ["users"] })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No users found.</p>
            </div>
          )}
        </div>
      )}

      {/* Admin Only Features Section */}
      {(user?.role === "admin" || user?.role === "owner") && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Admin Profile Management</h2>
          
          {/* Update Name Section */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Name</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current: {user.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileForm(!showProfileForm);
                  setProfileForm({ name: user.name });
                  setProfileError(null);
                  setProfileSuccess(null);
                }}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                {showProfileForm ? "Cancel" : "Change Name"}
              </button>
            </div>
            {showProfileForm && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new name"
                />
                {profileError && (
                  <div className="text-sm text-red-600 dark:text-red-400">{profileError}</div>
                )}
                {profileSuccess && (
                  <div className="text-sm text-green-600 dark:text-green-400">{profileSuccess}</div>
                )}
                <button
                  onClick={() => profileMutation.mutate()}
                  disabled={profileMutation.isPending || !profileForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileMutation.isPending ? "Updating..." : "Update Name"}
                </button>
              </div>
            )}
          </div>

          {/* Update Password Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Change your account password</p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                {showPasswordForm ? "Cancel" : "Change Password"}
              </button>
            </div>
            {showPasswordForm && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New password (min. 6 characters)"
                />
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                {passwordError && (
                  <div className="text-sm text-red-600 dark:text-red-400">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</div>
                )}
                <button
                  onClick={() => passwordMutation.mutate()}
                  disabled={passwordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, progress, color, bgColor, progressColor }) {
  return (
    <div className={`${bgColor} dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${color} dark:text-gray-300`}>{label}</h3>
      </div>
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value.toLocaleString()}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{progress}% of total</div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

function SeverityBar({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, percentage, color, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} dark:bg-gray-800 border ${borderColor} dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${color} dark:text-gray-300`}>{title}</h3>
        <div className={`text-2xl font-bold ${color} dark:text-gray-300`}>{percentage}%</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">Total vulnerabilities</div>
    </div>
  );
}

function count(list, key) {
  return list?.find((i) => i._id === key)?.count ?? 0;
}

function UserRow({ user, currentUser, onRoleUpdate }) {
  const [isChanging, setIsChanging] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const roleMutation = useMutation({
    mutationFn: () => updateUserRole(user._id, selectedRole),
    onSuccess: () => {
      setSuccess("Role updated successfully!");
      setError(null);
      setIsChanging(false);
      onRoleUpdate();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to update role");
      setSuccess(null);
    },
  });

  const isCurrentUser = currentUser?.id === user._id;
  const canChangeRole = !isCurrentUser && (currentUser?.role === "owner" || (currentUser?.role === "admin" && user.role !== "owner"));

  const handleRoleChange = () => {
    if (selectedRole === user.role) {
      setIsChanging(false);
      return;
    }
    roleMutation.mutate();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "owner": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "admin": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "analyst": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-900 dark:text-white">{user.name}</span>
          {isCurrentUser && (
            <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
      <td className="py-3 px-4">
        {isChanging ? (
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={roleMutation.isPending}
          >
            <option value="dev">Developer</option>
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
            {currentUser?.role === "owner" && <option value="owner">Owner</option>}
          </select>
        ) : (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        {isChanging ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRoleChange}
              disabled={roleMutation.isPending || selectedRole === user.role}
              className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roleMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsChanging(false);
                setSelectedRole(user.role);
                setError(null);
                setSuccess(null);
              }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          canChangeRole && (
            <button
              onClick={() => setIsChanging(true)}
              className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Change Role
            </button>
          )
        )}
        {error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</div>
        )}
        {success && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">{success}</div>
        )}
      </td>
    </tr>
  );
}
