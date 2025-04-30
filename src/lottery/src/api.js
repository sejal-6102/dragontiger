import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000" });

export const bookTicket = (ticket) => API.post("/tickets/book", ticket);
export const getTickets = () => API.get("/tickets/history");
export const announceWinners = (data) => API.post("/admin/announce", data);
export const getWinners = () => API.get("/tickets/check-winners");

export default API;
