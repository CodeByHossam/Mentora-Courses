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

  return null;
};

export default InstructorRequests;
