import { BrowserRouter } from "react-router";
import AppRoutes from "./routes";
import { ThemeProvider } from "@/contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App