import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVulnerability, deleteVulnerability, upsertVulnerability } from "../api/client";
import { SeverityPill, StatusPill } from "../components/StatusBadge";

export default function BugDetailsPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vulnerability", id],
    queryFn: () => getVulnerability(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVulnerability(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      navigate("/bugs");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => upsertVulnerability(id, { ...data, status: newStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vulnerability", id] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Vulnerability not found</div>
      </div>
    );
  }

  // Check if user can edit this bug (only owner, admin, or bug creator)
  const canEdit = user?.role === "admin" || user?.role === "owner" || (data && (
    data.createdBy?._id?.toString() === user?.id?.toString() || 
    data.createdBy?.toString() === user?.id?.toString() ||
    data.createdBy === user?.id
  ));
  const canDelete = user?.role === "admin" || user?.role === "owner";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{data.title}</h1>
          <div className="flex items-center gap-4">
            <SeverityPill severity={data.severity} />
            <StatusPill status={data.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/bugs/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Edit Vulnerability
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Delete Vulnerability
            </button>
          )}
          {!canEdit && (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
              You can only edit bugs you created
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm space-y-6">
        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Technical Description</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.description || "No description provided."}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Category</h3>
            <p className="text-gray-900 dark:text-white">{data.category || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Date Created</h3>
            <p className="text-gray-900 dark:text-white">{new Date(data.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Last Updated</h3>
            <p className="text-gray-900 dark:text-white">{new Date(data.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Vulnerability ID</h3>
            <p className="text-gray-900 dark:text-white font-mono text-sm">{data._id}</p>
          </div>
        </div>

        {/* Change Status - Only for owner or admin */}
        {canEdit && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Change Status</h3>
            <div className="flex flex-wrap gap-2">
              {["open", "in_review", "fixed", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => statusMutation.mutate(status)}
                  disabled={data.status === status || statusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    data.status === status
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

