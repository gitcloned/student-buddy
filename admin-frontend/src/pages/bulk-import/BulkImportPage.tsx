import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

interface TableSummary {
  tableName: string;
  inserts: number;
  updates: number;
  deletes: number;
  errors: string[];
}

interface PreviewResponse {
  success: boolean;
  summary: TableSummary[];
  totalInserts: number;
  totalUpdates: number;
  totalDeletes: number;
  totalErrors: number;
}

interface ImportResult {
  tableName: string;
  inserts: { success: number; failed: number };
  updates: { success: number; failed: number };
  deletes: { success: number; failed: number };
  errors: string[];
}

interface ImportResponse {
  success: boolean;
  backupPath: string;
  results: ImportResult[];
  summary: {
    totalInserts: number;
    totalUpdates: number;
    totalDeletes: number;
    totalErrors: number;
  };
}

interface Backup {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
}

const BulkImportPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bulk/export`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `database_export_${new Date().toISOString()}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsPreviewLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/bulk/preview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to preview import');
      }

      const data: PreviewResponse = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview import');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/bulk/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      const data: ImportResponse = await response.json();
      setImportResult(data);
      setPreviewData(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk/backups`);
      if (!response.ok) {
        throw new Error('Failed to load backups');
      }
      const data = await response.json();
      setBackups(data.backups);
      setShowBackups(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bulk Import / Export</h1>
        <Link to="/" className="text-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Export Data</h2>
        <p className="text-gray-600 mb-4">
          Download all database tables as an Excel file. Each table will be a separate sheet.
          The exported file includes a <code className="bg-gray-100 px-1 rounded">_status</code> column 
          that you can use to mark rows for INSERT, UPDATE, or DELETE operations.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Download Excel Export'}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Import Data</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Export the current data using the button above</li>
              <li>Open the Excel file and make your changes</li>
              <li>Set the <code className="bg-blue-100 px-1 rounded">_status</code> column for each row you want to modify:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><strong>INSERT</strong> - Add a new row (leave id blank)</li>
                  <li><strong>UPDATE</strong> - Update an existing row (id required)</li>
                  <li><strong>DELETE</strong> - Delete a row (id required)</li>
                </ul>
              </li>
              <li>Upload the modified file and preview changes</li>
              <li>Confirm to apply changes (a backup will be created automatically)</li>
            </ol>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          {selectedFile && (
            <div className="flex gap-4">
              <button
                onClick={handlePreview}
                disabled={isPreviewLoading}
                className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {isPreviewLoading ? 'Analyzing...' : 'Preview Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Results */}
      {previewData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preview Summary</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{previewData.totalInserts}</div>
              <div className="text-green-600">Inserts</div>
            </div>
            <div className="bg-blue-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">{previewData.totalUpdates}</div>
              <div className="text-blue-600">Updates</div>
            </div>
            <div className="bg-red-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-red-700">{previewData.totalDeletes}</div>
              <div className="text-red-600">Deletes</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-yellow-700">{previewData.totalErrors}</div>
              <div className="text-yellow-600">Errors</div>
            </div>
          </div>

          {previewData.summary.length > 0 && (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inserts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deletes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.summary.map((table) => (
                    <tr key={table.tableName}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{table.tableName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600">{table.inserts}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-600">{table.updates}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600">{table.deletes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-yellow-600">{table.errors.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {previewData.totalErrors > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Validation Errors:</h3>
              <ul className="list-disc list-inside text-yellow-700">
                {previewData.summary.flatMap((table) =>
                  table.errors.map((err, idx) => (
                    <li key={`${table.tableName}-${idx}`}>
                      <strong>{table.tableName}:</strong> {err}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleImport}
              disabled={isImporting || previewData.totalErrors > 0}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Confirm & Import'}
            </button>
            <button
              onClick={() => {
                setPreviewData(null);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Import Complete!</h2>
          
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
            <p className="text-green-700">
              <strong>Backup created:</strong> {importResult.backupPath}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{importResult.summary.totalInserts}</div>
              <div className="text-green-600">Inserted</div>
            </div>
            <div className="bg-blue-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">{importResult.summary.totalUpdates}</div>
              <div className="text-blue-600">Updated</div>
            </div>
            <div className="bg-red-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-red-700">{importResult.summary.totalDeletes}</div>
              <div className="text-red-600">Deleted</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-3xl font-bold text-yellow-700">{importResult.summary.totalErrors}</div>
              <div className="text-yellow-600">Errors</div>
            </div>
          </div>

          {importResult.results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inserts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deletes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importResult.results.map((table) => (
                    <tr key={table.tableName}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{table.tableName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-600">{table.inserts.success}</span>
                        {table.inserts.failed > 0 && (
                          <span className="text-red-600 ml-2">({table.inserts.failed} failed)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-blue-600">{table.updates.success}</span>
                        {table.updates.failed > 0 && (
                          <span className="text-red-600 ml-2">({table.updates.failed} failed)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-red-600">{table.deletes.success}</span>
                        {table.deletes.failed > 0 && (
                          <span className="text-red-600 ml-2">({table.deletes.failed} failed)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Backups Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Database Backups</h2>
          <button
            onClick={loadBackups}
            className="text-primary hover:underline"
          >
            {showBackups ? 'Refresh' : 'View Backups'}
          </button>
        </div>

        {showBackups && (
          <>
            {backups.length === 0 ? (
              <p className="text-gray-500">No backups found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.filename}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{backup.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatBytes(backup.size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(backup.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
