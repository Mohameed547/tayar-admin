import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { logout } from "./store/slices/authSlice";

const AppContent = () => {
  const { theme, language } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleLogout = () => {
      dispatch(logout());
      window.location.href = "/login";
    };
    window.addEventListener("auth-logout", handleLogout);
    return () => window.removeEventListener("auth-logout", handleLogout);
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "dir",
      language === "ar" ? "rtl" : "ltr",
    );
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  return <RouterProvider router={router} />;
};

const App = () => {
  return <AppContent />;
};

export default App;
