const dbHospital = db.getSiblingDB("sistema_hospitalar_nosql");

// Filtro find + projeção de campos (0 exclui _id).
dbHospital.pacientes.find(
  { nome: { $regex: "^J", $options: "i" } },
  { nome: 1, nascimento: 1, "contato.telefone": 1, _id: 0 }
);

// Filtro + ordenação + projeção.
dbHospital.consultas.find(
  { status: "realizada" },
  { pacienteId: 1, data: 1, status: 1, "medico.nome": 1, _id: 0 }
).sort({ data: -1 });

// Índice simples para pesquisar consultas por paciente.
printjson(dbHospital.consultas.createIndex({ pacienteId: 1 }, { name: "idx_consultas_paciente" }));
// Índice composto para filtrar por status e ordenar por data.
printjson(dbHospital.consultas.createIndex({ status: 1, data: -1 }, { name: "idx_consultas_status_data" }));

// Plano de execução: verifique winningPlan, IXSCAN/COLLSCAN e executionStats.
printjson(dbHospital.consultas.find({ status: "realizada" }).sort({ data: -1 }).explain("executionStats"));
printjson(dbHospital.consultas.find({ pacienteId: ObjectId("650000000000000000000001") }).explain("executionStats"));
