// hooks/useConfirm.jsx
import React, { useState } from "react"; // ✅ Capital "React"
import ConfirmationModal from "../components/ConfirmationModal"; // ✅ Ensure this uses .jsx or .tsx too if it contains JSX

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = ({ title, message }) =>
    new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });

  const ConfirmationModalWrapper = () => (
    <ConfirmationModal
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      onConfirm={confirmState.onConfirm}
      onCancel={confirmState.onCancel}
    />
  );

  return { confirm, ConfirmationModalWrapper };
};

//usage example

// import { useConfirm } from "../hooks/useConfirm";

// const { confirm, ConfirmationModalWrapper } = useConfirm();

// const handleClick = async () => {
//   const confirmed = await confirm({
//     title: "Delete this item?",
//     message: "This action cannot be undone.",
//   });

//   if (confirmed) {
//     // proceed
//   }
// return (
//   <>
//     <ConfirmationModalWrapper />
// + your component logic
//     <button onClick={handleClick}>Delete</button>
//   </>

// };
