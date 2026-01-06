const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'astral-card-pwa',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const getNotesForCurrentUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetNotesForCurrentUser');
}
getNotesForCurrentUserRef.operationName = 'GetNotesForCurrentUser';
exports.getNotesForCurrentUserRef = getNotesForCurrentUserRef;

exports.getNotesForCurrentUser = function getNotesForCurrentUser(dc) {
  return executeQuery(getNotesForCurrentUserRef(dc));
};

const updateNoteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateNote', inputVars);
}
updateNoteRef.operationName = 'UpdateNote';
exports.updateNoteRef = updateNoteRef;

exports.updateNote = function updateNote(dcOrVars, vars) {
  return executeMutation(updateNoteRef(dcOrVars, vars));
};

const deleteNoteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteNote', inputVars);
}
deleteNoteRef.operationName = 'DeleteNote';
exports.deleteNoteRef = deleteNoteRef;

exports.deleteNote = function deleteNote(dcOrVars, vars) {
  return executeMutation(deleteNoteRef(dcOrVars, vars));
};
