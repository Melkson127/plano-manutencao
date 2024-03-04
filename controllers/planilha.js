const Excel = require('exceljs')
const fs = require('fs')

let workbook = new Excel.Workbook()
async function extrairDados(path, worksheet) {
    let reader = await workbook.xlsx.readFile(path)
    let dados = reader.getWorksheet(worksheet).getSheetValues()
    return dados
}
function createIte(predio, planoManutencao, itemCategoryList) {

    let lines = ['command;subGroup;itemCategory;description;alternativeIdentifier;active;CF_equipamento;CF_LOCAL;CF_LOCAL_DO_ITEM;CF_Periodo;CF_TAG;CF_AREA;CF_tipo_eq']
    function getPeriodicidade(periodicidade) {
        if (periodicidade == "Semanal") {
            return "SE"
        }
        return periodicidade.slice(0, 1).toUpperCase()
    }
    let tipos = []
    let identifiers = []
    let periodicidades = []
    planoManutencao.forEach((row, i, arr) => {
        if (i > 1) {
            let identificacao = row[1]
            let tipo = row[2]
            tipos.push(tipo)
            let pavimento = row[3]
            let periodicidade = row[4]
            let itemCategory = ''
            periodicidade = getPeriodicidade(periodicidade)
            periodicidades.push(periodicidade)
            itemCategoryList.forEach((rowCategory, index, array) => {
                if (index > 1) {
                    if (tipo == rowCategory[1]) {
                        itemCategory = rowCategory[2]
                    }
                }
            })
            let siglaPredio = predio.replace(/ /g, '')
                .slice(0, 3).toUpperCase()
            let siglaSubgrupo = tipo.slice(0, 3)
            let identifier = `${siglaPredio}${siglaSubgrupo}${i - 1}_${periodicidade}`
            identifiers.push(identifier)
            lines.push(`I;${tipo};${itemCategory};${identificacao};${identifier};1;${tipo};${pavimento};${predio};${periodicidade};${identifier};${pavimento};${tipo}`)
        }
    })
    return { ite: lines.reduce((val, current) => `${val}\n${current}`), identifiers: identifiers, tipos: tipos, periodicidades: periodicidades }
}
function createIsa(tipos, identifiers, verificacoes, periodicidades) {
    let lines = ['command;active;order;section;item']
    tipos.forEach((value, i, arr) => {
        let section = verificacoes.filter((val, index) => {
            if (index > 1) {
                return val[1].trim() == `${value}_${periodicidades[i]}`
            }
            return false
        })
        lines.push(`I;1;1;${section.length > 0 ? section[0][2] : 'section não encontrada reveja a periodicidade'};${identifiers[i]}`)

    })
    return lines.reduce((val, current) => `${val}\n${current}`)
}
module.exports = async function create(req, res, next) {
    try {
        let predio = req.body.predio
        let arquivo = req.file
        // console.log(req.file)
        let planoManutencao = await extrairDados(arquivo.path, 'Inventário Cadastro')
        let itemCategoryList = await extrairDados("./planilha/Planilha_Completa.xlsx", 'itemCategory')
        let verificacoes = await extrairDados("./planilha/Planilha_Completa.xlsx", 'Verificações')

        // console.log(req.body)
        let ite = createIte(predio, planoManutencao, itemCategoryList)
        let isa = createIsa(ite.tipos, ite.identifiers, verificacoes, ite.periodicidades)
        await fs.rm(arquivo.path, (err) => {
            console.log(err)
        })
        res.render('pronto', { ite: ite.ite, isa: isa })
        next()
    } catch (err) {
        console.log('Exception:' + err)
        res.render('index')
    }

}
