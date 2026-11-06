import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import HomePage from "../features/home/HomePage";
import BulkPage from "../features/bulk-certificates/BulkPage";
import EditorPage from "../features/certificate-editor/EditorPage";
import ImageConverterPage from "../features/image-converter/ImageConverterPage";
import BackgroundRemoverPage from "../features/background-remover/BackgroundRemoverPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/bulk", element: <BulkPage /> },
      { path: "/editor", element: <EditorPage /> },
      { path: "/image-converter", element: <ImageConverterPage /> },
      { path: "/background-remover", element: <BackgroundRemoverPage /> },
    ],
  },
]);