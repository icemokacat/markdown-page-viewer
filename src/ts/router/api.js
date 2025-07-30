import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
const brunoMarkdown_REST_API_URI = '/api/bruno';
const brunoMarkdown_PAGE_API_URI = '/page/bruno';
// hash 함수 
const getUuid = () => {
    let uuid = uuidv4();
    uuid = uuid.replace(/-/g, '');
    return uuid;
};
// router
router.get('/list', (req, res) => {
    res.render('list');
});
export default router;
