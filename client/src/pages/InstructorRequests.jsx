import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Save, X } from "lucide-react";
import {
  useGetInstructorRequestsQuery,
  useUpdateInstructorRequestMutation,
  useDeleteInstructorRequestMutation,
  useAddInstructorNoteMutation,
  useEditInstructorNoteMutation,
  useDeleteInstructorNoteMutation,
} from "../store/services/instructorRequestApi";
import ProgressLoader from "../components/ProgressLoader";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import { useConfirm } from "../hooks/useConfirm";

const InstructorRequests = () => {
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const { data: requests, isLoading, error } = useGetInstructorRequestsQuery();

  const [updateStatus, { isLoading: updating }] =
    useUpdateInstructorRequestMutation();
  const [deleteRequest] = useDeleteInstructorRequestMutation();
  const [addNote, { isLoading: addingNote }] = useAddInstructorNoteMutation();
  const [editNote] = useEditInstructorNoteMutation();
  const [deleteNote] = useDeleteInstructorNoteMutation();

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (error) handleApiError(error);
  }, [error]);

  // ✅ Approve / Reject with optional note
  const handleDecision = async (id, status) => {
    setIsProcessing(true);
    try {
      await updateStatus({
        id,
        status,
        adminNote: adminNotes[id] || "",
      }).unwrap();

      handleApiSuccess(`Request ${status} successfully.`);
      setSelectedRequestId(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Add note only (no status change)
  const handleAddNote = async (id) => {
    if (!adminNotes[id]) return handleApiError("Note cannot be empty");

    setIsProcessing(true);
    try {
      await addNote({ id, adminNote: adminNotes[id] }).unwrap();
      handleApiSuccess("Note added successfully.");
      setAdminNotes((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditNote = async (requestId, noteId) => {
    const noteKey = `${requestId}-${noteId}`;
    const editedContent = editingNotes[noteKey];

    if (!editedContent || !editedContent.trim()) {
      return handleApiError("Note content cannot be empty");
    }

    try {
      await editNote({
        id: requestId,
        noteId: noteId,
        note: editedContent.trim(),
      }).unwrap();

      setEditingNotes((prev) => {
        const newState = { ...prev };
        delete newState[noteKey];
        return newState;
      });

      handleApiSuccess("Note updated successfully");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteNote = async (requestId, noteId) => {
    const confirmed = await confirm({
      title: "Delete this note?",
      message: "This action cannot be undone.",
    });

    if (confirmed) {
      try {
        await deleteNote({
          id: requestId,
          noteId: noteId,
        }).unwrap();
        handleApiSuccess("Note deleted successfully");
      } catch (err) {
        handleApiError(err);
      }
    }
  };

  // ✅ Delete request
  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete this instructor request?",
      message: "This action cannot be undone.",
    });

    if (confirmed) {
      try {
        await deleteRequest(id).unwrap();
        handleApiSuccess("Request deleted.");
      } catch (err) {
        handleApiError(err);
      }
    }
  };

  if (isLoading) return <ProgressLoader />;

  return (
    <div className="max-w-maxAppWidth mx-auto px-4 sm:px-6 lg:px-8">
      <ConfirmationModalWrapper />
      <h1 className="text-2xl font-bold mb-4">Instructor Requests</h1>
      {requests?.length === 0 && <p>No instructor requests at the moment.</p>}
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Field</th>
            <th className="p-3 text-left">Terms</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
            <th className="p-3 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {requests?.map((r) => (
            <React.Fragment key={r._id}>
              <tr className="border-b">
                <td className="p-3">{r.name||"-"}</td>
                <td className="p-3">{r.email||"-"}</td>
                <td className="p-3">{r.field||"-"}</td>
                <td className="p-3">{r.termsAccepted||"-"}</td>
                <td className="p-3 capitalize">{r.status||"-"}</td>
                <td className="p-3 flex gap-2">
                  <button
                    disabled={
                      r.status !== "pending" || updating || isProcessing
                    }
                    onClick={() => handleDecision(r._id, "approved")}
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-300"
                  >
                    Approve
                  </button>
                  <button
                    disabled={
                      r.status !== "pending" || updating || isProcessing
                    }
                    onClick={() => handleDecision(r._id, "rejected")}
                    className="px-3 py-1 bg-yellow-600 text-white rounded disabled:bg-gray-300"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDelete(r._id)}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      setSelectedRequestId(
                        selectedRequestId === r._id ? null : r._id
                      )
                    }
                    className="text-blue-600 hover:underline"
                  >
                    {selectedRequestId === r._id ? "▲" : "▼"}
                  </button>
                </td>
              </tr>
              {selectedRequestId === r._id && (
                <tr>
                  <td colSpan={6} className="bg-gray-50 p-4">
                    <p>
                      <strong>Bio:</strong> {r.bio || "N/A"}
                    </p>
                    <p>
                      <strong>Bank Name:</strong> {r.bankName}
                    </p>
                    <p>
                      <strong>Account Number:</strong> {r.bankAccountNumber}
                    </p>
                    <p>
                      <strong>IBAN:</strong> {r.iban}
                    </p>
                    <p>
                      <strong>University Certificate:</strong>{" "}
                      <a
                        href={r.universityCertificate}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View
                      </a>
                    </p>
                    {r.experienceCertificates?.length > 0 && (
                      <div className="mt-2">
                        <strong>Experience Certificates:</strong>
                        <ul className="list-disc ml-6">
                          {r.experienceCertificates.map((cert, idx) => (
                            <li key={idx}>
                              <a
                                href={cert}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                View Certificate {idx + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p>
                      <strong>Current status:</strong> {r.status}
                    </p>

                    <div>
                      <strong>Admin Notes:</strong>
                      {r.adminNotes && r.adminNotes.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {r.adminNotes.map((note, index) => {
                            const noteKey = `${r._id}-${note._id}`;
                            const isEditing =
                              editingNotes.hasOwnProperty(noteKey);

                            return (
                              <div
                                key={index}
                                className="bg-white p-3 rounded border-l-4 border-blue-500"
                              >
                                {isEditing ? (
                                  <div>
                                    <textarea
                                      rows={3}
                                      className="w-full px-2 py-1 border rounded text-sm"
                                      value={editingNotes[noteKey] || ""}
                                      onChange={(e) =>
                                        setEditingNotes((prev) => ({
                                          ...prev,
                                          [noteKey]: e.target.value,
                                        }))
                                      }
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() =>
                                          handleEditNote(r._id, note._id)
                                        }
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"
                                      >
                                        <Save size={12} /> Save
                                      </button>
                                      <button
                                        onClick={() =>
                                          setEditingNotes((prev) => {
                                            const newState = { ...prev };
                                            delete newState[noteKey];
                                            return newState;
                                          })
                                        }
                                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs flex items-center gap-1"
                                      >
                                        <X size={12} /> Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-gray-800">
                                      {note.note}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                      <div className="text-xs text-gray-500">
                                        By: {note.admin?.name || "Admin"} on{" "}
                                        {new Date(
                                          note.createdAt
                                        ).toLocaleString()}
                                        {note.updatedAt &&
                                          note.updatedAt !== note.createdAt && (
                                            <span className="ml-2">
                                              (edited:{" "}
                                              {new Date(
                                                note.updatedAt
                                              ).toLocaleString()}
                                              )
                                            </span>
                                          )}
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            setEditingNotes((prev) => ({
                                              ...prev,
                                              [noteKey]: note.note,
                                            }))
                                          }
                                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex items-center gap-1"
                                        >
                                          <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteNote(r._id, note._id)
                                          }
                                          className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">
                          No notes have been added
                        </p>
                      )}
                    </div>

                    {/* ✅ Admin Notes Section */}
                    <label className="block mt-4 font-medium text-gray-700">
                      Admin Note
                    </label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={adminNotes[r._id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handleAddNote(r._id)}
                      disabled={addingNote || isProcessing}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
                    >
                      Save Note
                    </button>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InstructorRequests;
