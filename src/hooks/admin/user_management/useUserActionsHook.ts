import { useState } from "react";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";

const EMPTY_FORM = { username: "", userId: "", role: "", subDepts: [] };

const getUserUUID = (user: any) => user?.userUUID || user?.user_uuid || user?.id || "";

export const useUserActions = (availableRoles: any[], onSuccess: () => void) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = async (user: any) => {
    const userUUID = getUserUUID(user);

    setSaving(true);
    setModalOpen(true);
    
    // Quick initialize so form doesn't flicker empty
    setForm({
      username: user.username || "",
      userId: user.userId || "",
      role: user.role?.roleName || user.role || "",
      subDepts: Array.isArray(user.subDepartments) ? user.subDepartments : [],
    });

    try {
      // API 4: fetch strict user details layout specifically for updating mapping
      const resp = await userManagementController.getUserById(userUUID);
      if (resp?.success && resp.data) {
         setEditTarget(resp.data);
         setForm({
           username: resp.data.username || "",
           userId: (resp.data.userId || user.userId || "") as string,
           role: resp.data.role || "",
           subDepts: Array.isArray(resp.data.subDepartments) ? resp.data.subDepartments : [],
         });
      } else {
         useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.LOAD_USER_FAILED, "error");
         setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (user: any) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.role) return;
    setSaving(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.SAVING_USER, "info", { loading: true });
    
    const selectedRoleObj = availableRoles.find(r => r.roleName === form.role);
    
    const basePayload: any = {
      username: form.username,
      subDepartments: form.subDepts.map((sd: any) => ({
        subDepartmentId: sd.subDepartmentId,
        subDepartmentName: sd.subDepartmentName,
        departmentId: sd.departmentId
      }))
    };

    if (!editTarget && selectedRoleObj) {
      basePayload.role = { roleId: selectedRoleObj.roleId, roleName: selectedRoleObj.roleName };
    }

    let resp;
    
    if (editTarget) {
      // API 3: update requires user_uuid
       basePayload.user_uuid = getUserUUID(editTarget);
       resp = await userManagementController.updateUser(basePayload);
    } else {
      // API 1: create requires userId payload string
       basePayload.userId = form.userId;
       resp = await userManagementController.createUser(basePayload);
    }
      
    if (resp?.success) {
      useAlertStore.getState().showAlert(resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.SAVE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onSuccess();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.OPERATION_FAILED, "error", { autoCloseMs: 3000 });
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.DELETING_USER, "info", { loading: true });
    
    // API 5: delete mapped exactly to target user_uuid
    const resp = await userManagementController.deleteUser(getUserUUID(deleteTarget));
    if (resp?.success) {
      useAlertStore.getState().showAlert(resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onSuccess();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleting(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_FAILED, "error", { autoCloseMs: 3000 });
      setDeleting(false);
    }
  };

  const handleFormChange = (field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubDeptsChange = (val: any) => {
    setForm(prev => ({ ...prev, subDepts: val }));
  };

  return {
    modalOpen, setModalOpen,
    deleteOpen, setDeleteOpen,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    form, setForm,
    saving,
    deleting,
    openCreate,
    openEdit,
    openDelete,
    handleSave,
    handleDelete,
    handleFormChange,
    handleSubDeptsChange,
  };
};
