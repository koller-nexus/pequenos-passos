export type RoutineKey = "mon-wed" | "tue-thu-fri" | "weekend";

export type RoutineTask = {
  id: string;
  label: string;
};

export type RoutinePlan = {
  key: RoutineKey;
  label: string;
  shortLabel: string;
  weekdays: number[];
  tasks: RoutineTask[];
};

export const ROUTINES: RoutinePlan[] = [
  {
    key: "mon-wed",
    label: "Segunda e quarta",
    shortLabel: "Seg. e qua.",
    weekdays: [1, 3],
    tasks: [
      { id: "make-bed", label: "arrumar a cama" },
      { id: "go-to-school", label: "ir pra escola" },
      { id: "change-football-clothes", label: "trocar de roupa (futebol)" },
      { id: "set-lunch-table", label: "arrumar mesa do almoço" },
      { id: "eat-lunch", label: "almoçar" },
      { id: "wash-lunch-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-lunch", label: "arrumar cozinha" },
      { id: "clean-dish-rack", label: "limpar porta prato" },
      { id: "brush-teeth-after-lunch", label: "escovar os dentes" },
      { id: "check-trash", label: "ver os lixos se precisa trocar" },
      { id: "clean-cat-litter", label: "limpar areia dos gatos" },
      { id: "do-homework", label: "fazer atividade de casa" },
      { id: "study", label: "estudar" },
      { id: "play-football", label: "ir pro futebol" },
      { id: "set-dinner-table", label: "arrumar mesa do jantar" },
      { id: "eat-dinner", label: "jantar" },
      { id: "wash-dinner-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-dinner", label: "limpar cozinha" },
      { id: "take-shower", label: "tomar banho" },
      { id: "brush-teeth-after-shower", label: "escovar dente" },
      { id: "sleep-by-21", label: "ir deitar até 21h" },
    ],
  },
  {
    key: "tue-thu-fri",
    label: "Terça, quinta e sexta",
    shortLabel: "Ter., qui. e sex.",
    weekdays: [2, 4, 5],
    tasks: [
      { id: "make-bed", label: "arrumar a cama" },
      { id: "go-to-school", label: "ir pra escola" },
      { id: "change-clothes", label: "trocar de roupa" },
      { id: "set-lunch-table", label: "arrumar mesa do almoço" },
      { id: "eat-lunch", label: "almoçar" },
      { id: "wash-lunch-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-lunch", label: "arrumar cozinha" },
      { id: "clean-dish-rack", label: "limpar porta prato" },
      { id: "brush-teeth-after-lunch", label: "escovar os dentes" },
      { id: "check-trash", label: "ver os lixos se precisa trocar" },
      { id: "clean-cat-litter", label: "limpar areia dos gatos" },
      { id: "do-homework", label: "fazer atividade de casa" },
      { id: "study", label: "estudar" },
      { id: "set-dinner-table", label: "arrumar mesa do jantar" },
      { id: "eat-dinner", label: "jantar" },
      { id: "wash-dinner-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-dinner", label: "limpar cozinha" },
      { id: "take-shower", label: "tomar banho" },
      { id: "brush-teeth-after-shower", label: "escovar dente" },
      { id: "sleep-by-21", label: "ir deitar até 21h" },
    ],
  },
  {
    key: "weekend",
    label: "Final de semana",
    shortLabel: "Fim de semana",
    weekdays: [0, 6],
    tasks: [
      {
        id: "use-phone-wisely",
        label: "Usar o celular com sabedoria, tem coisas mais importantes para fazer",
      },
      { id: "make-bed", label: "arrumar a cama" },
      { id: "change-clothes", label: "trocar de roupa" },
      { id: "eat-breakfast", label: "tomar café da manhã" },
      { id: "clean-breakfast-mess", label: "limpar o que sujou" },
      { id: "set-lunch-table", label: "arrumar mesa do almoço" },
      { id: "eat-lunch", label: "almoçar" },
      { id: "wash-lunch-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-lunch", label: "arrumar cozinha" },
      { id: "clean-dish-rack", label: "limpar porta prato" },
      { id: "brush-teeth-after-lunch", label: "escovar os dentes" },
      { id: "check-trash", label: "ver os lixos se precisa trocar" },
      { id: "clean-cat-litter", label: "limpar areia dos gatos" },
      { id: "do-homework", label: "fazer atividade de casa" },
      { id: "study", label: "estudar" },
      { id: "set-dinner-table", label: "arrumar mesa do jantar" },
      { id: "eat-dinner", label: "jantar" },
      { id: "wash-dinner-dishes", label: "lavar louça" },
      { id: "clean-kitchen-after-dinner", label: "limpar cozinha" },
      { id: "take-shower", label: "tomar banho" },
      { id: "brush-teeth-after-shower", label: "escovar dente" },
      { id: "sleep-by-23", label: "ir deitar até 23h" },
    ],
  },
];

export const MANDATORY_TASKS: RoutineTask[] = [
  {
    id: "help-at-home",
    label: "ajudar nas atividades em casa sem precisar pedir",
  },
  { id: "take-trash-down", label: "tirar os lixos e levar lá embaixo" },
  {
    id: "warn-about-shopping",
    label: "avisar com antecedência se precisa comprar algo",
  },
  { id: "get-good-grades", label: "tirar nota boa" },
  { id: "care-for-cats", label: "cuidar dos gatos" },
  {
    id: "clean-house-weekly",
    label: "ajudar a limpar a casa 1 vez na semana",
  },
  { id: "always-tell-truth", label: "sempre falar a verdade" },
  { id: "no-fighting-or-rudeness", label: "não brigar ou ser grosseiro" },
  {
    id: "act-when-something-needs-doing",
    label:
      "não ignorar se precisa fazer algo. Exemplo: viu sujeira e não foi você que fez? Limpe do mesmo jeito!",
  },
];

export function getRoutineForDate(date: Date): RoutinePlan {
  const routine = ROUTINES.find((candidate) =>
    candidate.weekdays.includes(date.getDay()),
  );

  if (!routine) {
    throw new Error(`No routine configured for weekday ${date.getDay()}`);
  }

  return routine;
}

export function getRoutineByKey(key: RoutineKey): RoutinePlan {
  const routine = ROUTINES.find((candidate) => candidate.key === key);

  if (!routine) {
    throw new Error(`Unknown routine key: ${key}`);
  }

  return routine;
}
