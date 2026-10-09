// Execute com mongosh: mongosh "mongodb://localhost:27017" 01_modelo_e_dados.js
// Dados fictícios para demonstração acadêmica; não usar dados reais de pacientes.
const dbHospital = db.getSiblingDB("sistema_hospitalar_nosql");
dbHospital.pacientes.drop();
dbHospital.consultas.drop();

const pacientes = [
  { _id: ObjectId("650000000000000000000001"), nome: "Joana Lima", nascimento: ISODate("1988-03-14T00:00:00Z"), contato: { telefone: "559100000001" }, alergias: ["dipirona"] },
  { _id: ObjectId("650000000000000000000002"), nome: "Carlos Nunes", nascimento: ISODate("1975-11-02T00:00:00Z"), contato: { telefone: "559100000002", email: "carlos.exemplo@example.com" } },
  { _id: ObjectId("650000000000000000000003"), nome: "Marina Costa", nascimento: ISODate("1997-07-22T00:00:00Z"), alergias: [], contato: { telefone: "559100000003" }, preferenciaContato: "email" },
  { _id: ObjectId("650000000000000000000004"), nome: "Pedro Alves", nascimento: ISODate("1964-01-09T00:00:00Z"), contato: { telefone: "559100000004" }, observacaoCadastro: "Prefere atendimento pela manhã" },
  { _id: ObjectId("650000000000000000000005"), nome: "Lia Rocha", nascimento: ISODate("2001-05-30T00:00:00Z"), contato: { telefone: "559100000005" }, alergias: ["látex"] }
];
dbHospital.pacientes.insertMany(pacientes);

// Referencing: pacienteId aponta para pacientes._id. Embedding: triagem é um
// pequeno conjunto de dados específico daquela consulta e consultado junto dela.
dbHospital.consultas.insertMany([
  { pacienteId: pacientes[0]._id, medico: { crm: "CRM12345", nome: "Ana Souza", especialidade: "Cardiologia" }, data: ISODate("2026-09-01T12:30:00Z"), status: "realizada", diagnosticos: ["hipertensão"], triagem: { pressao: "130/85", temperaturaC: 36.7 } },
  { pacienteId: pacientes[1]._id, medico: { crm: "CRM23456", nome: "Bruno Reis", especialidade: "Clínica Geral" }, data: ISODate("2026-09-02T13:00:00Z"), status: "realizada", diagnosticos: ["consulta de rotina"], triagem: { temperaturaC: 36.5 } },
  { pacienteId: pacientes[2]._id, medico: { crm: "CRM12345", nome: "Ana Souza", especialidade: "Cardiologia" }, data: ISODate("2026-09-03T14:00:00Z"), status: "agendada", triagem: { pressao: "118/76" } },
  { pacienteId: pacientes[0]._id, medico: { crm: "CRM34567", nome: "Rui Melo", especialidade: "Dermatologia" }, data: ISODate("2026-09-04T15:15:00Z"), status: "realizada", diagnosticos: ["dermatite"], triagem: { temperaturaC: 36.8 }, anexos: [{ tipo: "foto", descricao: "Imagem de exemplo" }] },
  { pacienteId: pacientes[3]._id, medico: { crm: "CRM23456", nome: "Bruno Reis", especialidade: "Clínica Geral" }, data: ISODate("2026-09-05T11:30:00Z"), status: "cancelada", motivoCancelamento: "Solicitação do paciente" },
  { pacienteId: pacientes[4]._id, medico: { crm: "CRM45678", nome: "Nina Barros", especialidade: "Pediatria" }, data: ISODate("2026-09-06T16:45:00Z"), status: "realizada", diagnosticos: ["avaliação geral"], triagem: { temperaturaC: 36.4, pesoKg: 52.1, alturaCm: 162 } }
]);

print("Pacientes inseridos: " + dbHospital.pacientes.countDocuments());
print("Consultas inseridas: " + dbHospital.consultas.countDocuments());
