const express = require('express')
const path = require('path')
const createItens = require('./controllers/planilha')
const app = express()
const port = process.env.PORT || 3000
//configurações view engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
//configurações router
const router = express.Router()
app.use(router)
// configurações upload de arquivos
const multer = require('multer')
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
//Configurações body e json
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
//rotas
router.post('/create', upload.single('plano'), (req, res, next) => createItens(req, res, next))
router.get('/', (req, res) => {
    res.render(__dirname + '/views/index.ejs')
})
app.listen(port, () => {
    console.log('server running on port ' + port)
})