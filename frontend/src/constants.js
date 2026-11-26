export const pujaNames = [
  "Ganesh Puja",
  "Durga Puja",
  "Arogya Prapti Puja",
  "Laxmi Puja",
];

export const statuses = ["Pending", "Confirmed", "In Progress", "Completed"];

export const sortOptions = {
  newest: { sortBy: "createdAt", order: "desc" },
  date: { sortBy: "date", order: "asc" },
  amount: { sortBy: "amount", order: "desc" },
  name: { sortBy: "devotee.name", order: "asc" },
};
