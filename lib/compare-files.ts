import type { ComparisonResult, ProductData } from "./types";
import excel from "exceljs";
import { XMLParser } from "fast-xml-parser";

export async function parseXlsx(buffer: ArrayBuffer) {
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets.pop()!;
  const prods: { [key: string]: [number, number] } = {};
  worksheet.eachRow({ includeEmpty: true }, function (row) {
    if (
      Array.isArray(row.values) &&
      row.values.length > 0 &&
      row.values[1] != null
    ) {
      const prod = row.values[1],
        qntd = row.values[2],
        peso_trib = row.values[4];
      if (
        typeof prod === "string" &&
        typeof qntd === "number" &&
        typeof peso_trib === "number"
      ) {
        const v = {
          prod,
          qntd,
          peso_trib,
        };

        if (prods[prod] != null) {
          prods[prod][0] += v.qntd;
          prods[prod][1] += v.peso_trib;
        } else prods[prod] = [v.qntd, v.peso_trib];

        console.log(prod, prods[prod]);
      }
    }
  });

  return Object.fromEntries(
    Object.entries(prods).map(([key, [qntd, peso_trib]]) => [
      key,
      [Number(qntd.toFixed(4)), Number(peso_trib.toFixed(4))] as const,
    ]),
  );
}

export function parseXml(xmlString: string) {
  const parser = new XMLParser();
  let jObj = parser.parse(xmlString);

  const prods_nfe: { [key: string]: { ids: { [id: string]: [number, number] }; res: [number, number] } } = {};

  console.log(jObj.NFe.infNFe.det)
  jObj.NFe.infNFe.det.forEach((prod, nItem) => {
    if (prods_nfe[prod.prod.cProd] != null) {
      prods_nfe[prod.prod.cProd].ids[nItem.toString()] = [prod.prod.qCom, prod.prod.qTrib];
      prods_nfe[prod.prod.cProd].res[0] += prod.prod.qCom;
      prods_nfe[prod.prod.cProd].res[1] += prod.prod.qTrib;
    }
    else prods_nfe[prod.prod.cProd] = {
      ids: { [nItem.toString()]: [prod.prod.qCom, prod.prod.qTrib]},
      res: [prod.prod.qCom, prod.prod.qTrib]
    };
  })

  return prods_nfe;
}

export function compareFiles(
  xlsxData: Awaited<ReturnType<typeof parseXlsx>>,
  xmlData: ReturnType<typeof parseXml>,
): ComparisonResult {
  const result: ComparisonResult = {
    eq: {},
    diff: {},
    same_sku: {}
  };

  for (const prod in xlsxData) {
    const prod_pl = xlsxData[prod];
    const prod_nfe = xmlData[prod];

    console.log('prod_nfe.ids', prod_nfe.ids)
    for (const id in prod_nfe?.ids) {
      result.same_sku[id] = [prod, prod_nfe.ids[prod][0], prod_nfe.ids[prod][1]]
    }

    if (prod_pl?.[0] === prod_nfe?.res[0] && prod_pl?.[1] === prod_nfe?.res[1])
      result.eq[prod] = [
        [prod_pl?.[0] ?? 0, prod_pl?.[1] ?? 0],
        [prod_nfe?.res[0] ?? 0, prod_nfe?.res[1] ?? 0],
      ];
    else
      result.diff[prod] = [
        [prod_pl?.[0] ?? 0, prod_pl?.[1] ?? 0],
        [prod_nfe?.res[0] ?? 0, prod_nfe?.res[1] ?? 0],
      ];
  }

  return result;
}
