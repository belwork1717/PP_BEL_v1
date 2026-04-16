import { useState } from "react";
import { batchManagementController } from "../../../controllers/admin/batch_management/batchManagementController";
import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.BATCH_MANAGEMENT;

const EMPTY_FORM = {
  batchId:       "",
  motorId:       "",
  /** Stored as the motorTypeName string; converted to {id,name} object when posting */
  motorType:     "",
  projectName:   "",
  batchType:     "",
  priority:      "Medium",
  /** systemManager id string selected from dropdown */
  assignedTo:    "",
};

export const useBatchActions = (userOptions: any[], onSuccess: () => void) => {
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [form, setForm]                 = useState({ ...EMPTY_FORM });
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  /* ── Populate form from a BatchListItemModel-shaped object ─────────────── */
  const modelToForm = (b: any) => ({
    batchId:     b.batchId       ?? "",
    motorId:     b.motorId       ?? "",
    motorType:   b.motorType?.motorTypeName ?? (typeof b.motorType === "string" ? b.motorType : ""),
    projectName: b.projectName   ?? "",
    batchType:   b.batchType     ?? "",
    priority:    b.priority      ?? "Medium",
    assignedTo:  b.systemManager?.id ?? "",
  });

  /* ── Open create ──────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  /* ── Open edit: fetch full details first ──────────────────────────────── */
  const openEdit = async (batch: any) => {
    const batchId = batch.batchId;

    setSaving(true);
    setModalOpen(true);
    setEditTarget(batch);
    setForm(modelToForm(batch));

    try {
      const resp = await batchManagementController.getBatchById(batchId);
      if (resp) {
        setEditTarget(resp);
        setForm(modelToForm(resp));
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Open delete: reset reason each time ──────────────────────────────── */
  const openDelete = (batch: any) => {
    setDeleteTarget(batch);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  /* ── Save (create or update) — mirrors useUserActionsHook pattern ──────── */
  const handleSave = async () => {
    if (!form.batchId || !form.motorId || !form.projectName || !form.batchType || !form.motorType) return;

    setSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_BATCH, "info", { loading: true });

    const assignedUser = userOptions.find((user: any) => user.id === form.assignedTo);

    // Build the motorType object expected by the payload model
    const formForApi = {
      ...form,
      motorType: { motorTypeId: 0, motorTypeName: form.motorType },
      systemManager: form.assignedTo
        ? { id: form.assignedTo, name: assignedUser?.username || assignedUser?.name || "" }
        : { id: "", name: "" },
    };

    const ok = editTarget
      ? await batchManagementController.updateBatch(editTarget.batchId, formForApi)
      : await batchManagementController.createBatch(formForApi);

    if (ok) {
      setTimeout(() => {
        onSuccess();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      setSaving(false);
    }
  };

  /* ── Delete — validates reason ─────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget || !deleteReason.trim()) return;

    const batchId = deleteTarget.batchId;

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING_BATCH, "info", { loading: true });

    const ok = await batchManagementController.deleteBatch(
      batchId,
      deleteReason.trim(),
    );

    if (ok) {
      setTimeout(() => {
        onSuccess();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason("");
        setDeleting(false);
      }, 1000);
    } else {
      setDeleting(false);
    }
  };

  const handleFormChange = (field: string) => (e: any) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return {
    modalOpen,  setModalOpen,
    deleteOpen, setDeleteOpen,
    editTarget,
    deleteTarget,
    deleteReason, setDeleteReason,
    form,
    saving,
    deleting,
    openCreate,
    openEdit,
    openDelete,
    handleSave,
    handleDelete,
    handleFormChange,
  };
};
