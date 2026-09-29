import { describe, expect, it } from "vitest";

import {
  getRoutineForDate,
  MANDATORY_TASKS,
  ROUTINES,
} from "@/data/routines";

const labelsFor = (routineKey: string) =>
  ROUTINES.find((routine) => routine.key === routineKey)?.tasks.map((task) => task.label);

describe("routine data", () => {
  it("maps every weekday to the expected routine", () => {
    expect(getRoutineForDate(new Date(2026, 8, 28)).key).toBe("mon-wed");
    expect(getRoutineForDate(new Date(2026, 8, 29)).key).toBe("tue-thu-fri");
    expect(getRoutineForDate(new Date(2026, 8, 30)).key).toBe("mon-wed");
    expect(getRoutineForDate(new Date(2026, 9, 1)).key).toBe("tue-thu-fri");
    expect(getRoutineForDate(new Date(2026, 9, 2)).key).toBe("tue-thu-fri");
    expect(getRoutineForDate(new Date(2026, 9, 3)).key).toBe("weekend");
    expect(getRoutineForDate(new Date(2026, 9, 4)).key).toBe("weekend");
  });

  it("keeps the Monday and Wednesday routine in the requested order", () => {
    expect(labelsFor("mon-wed")).toEqual([
      "arrumar a cama",
      "ir pra escola",
      "trocar de roupa (futebol)",
      "arrumar mesa do almoço",
      "almoçar",
      "lavar louça",
      "arrumar cozinha",
      "limpar porta prato",
      "escovar os dentes",
      "ver os lixos se precisa trocar",
      "limpar areia dos gatos",
      "fazer atividade de casa",
      "estudar",
      "ir pro futebol",
      "arrumar mesa do jantar",
      "jantar",
      "lavar louça",
      "limpar cozinha",
      "tomar banho",
      "escovar dente",
      "ir deitar até 21h",
    ]);
  });

  it("keeps the Tuesday, Thursday and Friday routine in the requested order", () => {
    expect(labelsFor("tue-thu-fri")).toEqual([
      "arrumar a cama",
      "ir pra escola",
      "trocar de roupa",
      "arrumar mesa do almoço",
      "almoçar",
      "lavar louça",
      "arrumar cozinha",
      "limpar porta prato",
      "escovar os dentes",
      "ver os lixos se precisa trocar",
      "limpar areia dos gatos",
      "fazer atividade de casa",
      "estudar",
      "arrumar mesa do jantar",
      "jantar",
      "lavar louça",
      "limpar cozinha",
      "tomar banho",
      "escovar dente",
      "ir deitar até 21h",
    ]);
  });

  it("keeps the weekend and mandatory lists in the requested order", () => {
    expect(labelsFor("weekend")).toEqual([
      "Usar o celular com sabedoria, tem coisas mais importantes para fazer",
      "arrumar a cama",
      "trocar de roupa",
      "tomar café da manhã",
      "limpar o que sujou",
      "arrumar mesa do almoço",
      "almoçar",
      "lavar louça",
      "arrumar cozinha",
      "limpar porta prato",
      "escovar os dentes",
      "ver os lixos se precisa trocar",
      "limpar areia dos gatos",
      "fazer atividade de casa",
      "estudar",
      "arrumar mesa do jantar",
      "jantar",
      "lavar louça",
      "limpar cozinha",
      "tomar banho",
      "escovar dente",
      "ir deitar até 23h",
    ]);
    expect(MANDATORY_TASKS.map((task) => task.label)).toEqual([
      "ajudar nas atividades em casa sem precisar pedir",
      "tirar os lixos e levar lá embaixo",
      "avisar com antecedência se precisa comprar algo",
      "tirar nota boa",
      "cuidar dos gatos",
      "ajudar a limpar a casa 1 vez na semana",
      "sempre falar a verdade",
      "não brigar ou ser grosseiro",
      "não ignorar se precisa fazer algo. Exemplo: viu sujeira e não foi você que fez? Limpe do mesmo jeito!",
    ]);
  });
});
