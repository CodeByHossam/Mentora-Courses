import { jwtDecode } from "jwt-decode";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../store/slices/authSlice";

export const useAuth = () => {
  const token = useSelector(selectCurrentToken);
  let user = null;

  if (token) {
    try {
      user = jwtDecode(token);
    } catch (error) {
      console.error("Invalid token:", error);
    }
  }

  return { token, user };
};
