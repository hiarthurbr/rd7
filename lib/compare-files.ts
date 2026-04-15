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

  const prods_nfe: { [key: string]: [number, number] } = {};

  for (const prod of jObj.NFe.infNFe.det) {
    prods_nfe[prod.prod.cProd] = [prod.prod.qCom, prod.prod.qTrib];
  }

  return prods_nfe;
}

export function compareFiles(
  xlsxData: Awaited<ReturnType<typeof parseXlsx>>,
  xmlData: ReturnType<typeof parseXml>,
): ComparisonResult {
  const result: ComparisonResult = {
    eq: {},
    diff: {},
  };

  for (const prod in xlsxData) {
    const prod_pl = xlsxData[prod];
    const prod_nfe = xmlData[prod];

    if (prod_pl?.[0] === prod_nfe?.[0] && prod_pl?.[1] === prod_nfe?.[1])
      result.eq[prod] = [
        [prod_pl?.[0] ?? 0, prod_pl?.[1] ?? 0],
        [prod_nfe?.[0] ?? 0, prod_nfe?.[1] ?? 0],
      ];
    else
      result.diff[prod] = [
        [prod_pl?.[0] ?? 0, prod_pl?.[1] ?? 0],
        [prod_nfe?.[0] ?? 0, prod_nfe?.[1] ?? 0],
      ];
  }

  return result;
}
