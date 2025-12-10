import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listVulnerabilities } from "../api/client";
import { SeverityPill, StatusPill } from "../components/StatusBadge";

export default function VulnerabilitiesPage({ user }) {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["vulnerabilities"], queryFn: () => listVulnerabilities() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bugs</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Create and track security vulnerabilities. You can edit bugs you created.
          </p>
        </div>
        <button
          onClick={() => navigate("/bugs/new")}
          className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          New Bug
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bug Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date Created</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data?.map((v) => (
              <tr
                key={v._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => navigate(`/bugs/${v._id}`)}
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{v.title}</td>
                <td className="px-6 py-4">
                  <SeverityPill severity={v.severity} />
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={v.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td className="px-6 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={4}>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No vulnerabilities yet. Add the first one.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
