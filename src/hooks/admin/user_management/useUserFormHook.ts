import { useState, useMemo, useCallback, useEffect } from "react";

const SUBDEPT_RESTRICTED_ROLES = ["Admin", "System Manager"];
const SUBDEPT_MANDATORY_ROLES = ["User", "Approver"];

export const useUserFormModal = ({
  open,
  editTarget,
  availableSubDepts,
  form,
  onSubDeptsChange,
}: {
  open: boolean;
  editTarget: any;
  availableSubDepts: any[];
  form: any;
  onSubDeptsChange: (subDepts: any[]) => void;
}) => {
  // Selector panel open/close
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Dynamically computed card height based on viewport
  const [selectorMaxHeight, setSelectorMaxHeight] = useState(240);

  // Reset selector state when modal opens/closes or editTarget changes
  useEffect(() => {
    if (!open) {
      setSelectorOpen(false);
      setSearch("");
    }
  }, [open, editTarget]);

  // Compute available height for the selector list dynamically
  useEffect(() => {
    const computeHeight = () => {
      const viewportHeight = window.innerHeight;
      // Modal takes ~90vh max, header ~72px, footer ~60px, fields above ~220px, card chrome ~90px
      const reserved = 72 + 60 + 220 + 90;
      const available = Math.floor(viewportHeight * 0.9) - reserved;
      // Clamp between 120px (at least 2 items) and 320px
      setSelectorMaxHeight(Math.min(320, Math.max(120, available)));
    };

    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  // Role flags
  const subDeptsRestricted = useMemo(
    () => SUBDEPT_RESTRICTED_ROLES.includes(form.role),
    [form.role]
  );

  const subDeptsMandatory = useMemo(
    () => SUBDEPT_MANDATORY_ROLES.includes(form.role),
    [form.role]
  );

  // Form validation
  const formValid = useMemo(
    () =>
      Boolean(
        form.username?.trim() &&
          form.userId?.trim() &&
          form.role &&
          (subDeptsMandatory ? form.subDepts.length > 0 : true)
      ),
    [form.username, form.userId, form.role, form.subDepts, subDeptsMandatory]
  );

  // Selected IDs derived from form state
  const selectedSubDeptIds = useMemo(
    () => form.subDepts.map((sd: any) => sd.subDepartmentId),
    [form.subDepts]
  );

  // Filtered list based on search query
  const filteredDepts = useMemo(() => {
    if (!search.trim()) return availableSubDepts || [];
    return (availableSubDepts || []).filter((sd: any) =>
      sd.subDepartmentName.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableSubDepts, search]);

  // Toggle a single sub-dept
  const handleToggleDept = useCallback(
    (sd: any) => {
      const exists = selectedSubDeptIds.includes(sd.subDepartmentId);
      onSubDeptsChange(
        exists
          ? form.subDepts.filter(
              (s: any) => s.subDepartmentId !== sd.subDepartmentId
            )
          : [...form.subDepts, sd]
      );
    },
    [selectedSubDeptIds, form.subDepts, onSubDeptsChange]
  );

  // Remove a single sub-dept from selected list
  const handleRemoveSubDept = useCallback(
    (id: number) => {
      onSubDeptsChange(
        form.subDepts.filter((sd: any) => sd.subDepartmentId !== id)
      );
    },
    [form.subDepts, onSubDeptsChange]
  );

  // Clear all selected sub-depts
  const handleClearAll = useCallback(() => {
    onSubDeptsChange([]);
  }, [onSubDeptsChange]);

  // Toggle selector open/close
  const handleToggleSelector = useCallback(() => {
    setSelectorOpen((prev) => {
      if (prev) setSearch("");
      return !prev;
    });
  }, []);

  return {
    // State
    selectorOpen,
    search,
    setSearch,
    selectorMaxHeight,

    // Derived flags
    subDeptsRestricted,
    subDeptsMandatory,
    formValid,
    selectedSubDeptIds,
    filteredDepts,

    // Handlers
    handleToggleDept,
    handleRemoveSubDept,
    handleClearAll,
    handleToggleSelector,
  };
};