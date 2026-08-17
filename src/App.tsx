import { BrowserRouter } from "react-router-dom";
import { ConsoleLayout } from "./app/ConsoleLayout";
import { StoreProvider } from "./store";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ConsoleLayout />
      </BrowserRouter>
    </StoreProvider>
  );
}
