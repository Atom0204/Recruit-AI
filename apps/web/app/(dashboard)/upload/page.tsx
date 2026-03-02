import { PageTransition } from "../../../components/page-transition";
import { UploadWorkflow } from "../../../components/upload/upload-workflow";

export default function UploadPage() {
  return (
    <PageTransition state="upload">
      <UploadWorkflow />
    </PageTransition>
  );
}
