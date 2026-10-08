import express from "express";
import authStaff from "../middleware/authStaff.js";
import { queueDoctor, getQueue, issue, call, action, pause, board, token } from "../controllers/queueController.js";

const queueRouter = express.Router();

// Public: waiting-room screen and a patient's "see my turn" page
queueRouter.get("/public/board", board);
queueRouter.get("/public/token/:publicId", token);

// Reception (admin login) and doctors (their own queue only)
queueRouter.get("/", authStaff, queueDoctor, getQueue);
queueRouter.post("/issue", authStaff, queueDoctor, issue);
queueRouter.post("/call", authStaff, queueDoctor, call);
queueRouter.post("/action", authStaff, queueDoctor, action);
queueRouter.post("/pause", authStaff, queueDoctor, pause);

export default queueRouter;
