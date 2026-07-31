import React from 'react';
import Modal from '../common/Modal.jsx';
import ChatPanel from './ChatPanel.jsx';

const ChatModal = ({ patient, onClose }) => (
  <Modal open={!!patient} onClose={onClose} title={`Chat · ${patient?.name || ''}`} wide>
    {patient && <ChatPanel patientId={patient._id} />}
  </Modal>
);

export default ChatModal;
