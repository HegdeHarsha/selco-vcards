import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

type Props = {
  children: JSX.Element;
};

export default function ProtectedRoute({ children }: Props) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}
