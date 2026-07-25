// Temporary data: the integration owner will replace this with a MySQL query.
const users = [
  { id: 1, name: "Rani Singh", email: "rani@justuju.in" },
  { id: 2, name: "Shanti Singh", email: "shanti@justuju.in" },
  { id: 3, name: "Pooja", email: "pooja@justuju.in" },
];

export function getUsers(_req, res) {
  res.status(200).json({ users });
}
