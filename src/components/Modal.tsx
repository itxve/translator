import {
  Modal,
  Button,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { ReactNode } from "react";

function ModalApp(props: {
  children: ReactNode;
  title: string;
  footer: (close: () => void) => ReactNode;
  open: (onOpen: () => void) => ReactNode;
}) {
  const { children, title, footer, open } = props;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      {open(onOpen)}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody>{children}</ModalBody>
              <ModalFooter>{footer(onClose)}</ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default ModalApp;
