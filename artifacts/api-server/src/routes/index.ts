import { Router, type IRouter } from "express";
import healthRouter from "./health";
import competitorsRouter from "./competitors";
import checksRouter from "./checks";
import digestsRouter from "./digests";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(competitorsRouter);
router.use(checksRouter);
router.use(digestsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);

export default router;
