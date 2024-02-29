const express = require('express')
const path = require('path')
const createItens = require('./controllers/planilha')
const app = express()
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
const router = express.Router()
const multer = require('multer')
const port = process.env.PORT || 3000
// Configuração de armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './planilha/')
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original:
        const extensaoArquivo = file.originalname.split('.')[1];

        // Indica o novo nome do arquivo:
        cb(null, `plano-${Date.now()}.${extensaoArquivo}`)
    }
});
const upload = multer({ storage })
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.post('/create', upload.single('plano'), (req, res, next) => createItens(req, res, next))
router.get('/', (req, res) => {
    res.render(__dirname + '/views/index.ejs')
})

app.use(router)
app.listen(port, () => {
    console.log('server running on port ' + port)
})