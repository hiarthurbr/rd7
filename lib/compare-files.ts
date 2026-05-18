import type { ComparisonResult, ProductData } from "./types";
import excel from "exceljs";
import { XMLParser } from "fast-xml-parser";
import z from "zod";

function get_propostas(xml: string) {
  return new Set(
    xml
      .matchAll(/(PROPOSTA: [0-9]+)/g)
      .toArray()
      .map(([proposta]) => proposta.substring(10))
      .filter((str) => str.length >= 5),
  );
}

export async function parseXlsx(buffer: ArrayBuffer) {
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(buffer);

  console.log({ worksheets: workbook.worksheets });

  const worksheet = workbook.worksheets
    .filter((w) => w.state === "visible")
    .pop()!;
  console.log({ worksheet });
  const prods: { [key: string]: [number, number] } = {};
  worksheet.eachRow({ includeEmpty: true }, function (row) {
    if (
      Array.isArray(row.values) &&
      row.values.length > 0 &&
      row.values[1] != null
    ) {
      const prod = row.values[1],
        qntd = z.coerce.number().safeParse(row.values[2]),
        peso_uni = z.coerce.number().safeParse(row.values[3]);
      if (typeof prod === "string" && qntd.success && peso_uni.success) {
        const v = {
          prod,
          qntd,
          peso_trib: qntd.data * peso_uni.data,
        };

        if (prods[prod] != null) {
          prods[prod][0] += v.qntd.data;
          prods[prod][1] += v.peso_trib;
        } else prods[prod] = [v.qntd.data, v.peso_trib];

        console.log(prod, prods[prod]);
      }
    }
  });

  const res = Object.fromEntries(
    Object.entries(prods).map(([key, [qntd, peso_trib]]) => [
      key,
      [Number(qntd.toFixed(4)), Number(peso_trib.toFixed(4))] as const,
    ]),
  );

  console.log({ xlsx: res });

  return res;
}

export function parseXml(xmlString: string) {
  const parser = new XMLParser();
  let jObj = parser.parse(xmlString);

  const prods_nfe: {
    [key: string]: {
      ids: Array<[number, number, number]>;
      res: [number, number];
    };
  } = {};

  console.log();
  // @ts-ignore
  jObj.NFe.infNFe.det.forEach((prod, nItem) => {
    if (prods_nfe[prod.prod.cProd] != null) {
      prods_nfe[prod.prod.cProd].ids.push([
        nItem + 1,
        prod.prod.qCom,
        prod.prod.qTrib,
      ]);
      prods_nfe[prod.prod.cProd].res[0] += prod.prod.qCom;
      prods_nfe[prod.prod.cProd].res[1] += prod.prod.qTrib;
    } else
      prods_nfe[prod.prod.cProd] = {
        ids: [[nItem + 1, prod.prod.qCom, prod.prod.qTrib]],
        res: [prod.prod.qCom, prod.prod.qTrib],
      };
  });

  return { xmlData: prods_nfe, raw: jObj.NFe.infNFe.det };
}

export function compareFiles(
  xlsxData: Awaited<ReturnType<typeof parseXlsx>>,
  { xmlData, raw }: ReturnType<typeof parseXml>,
): ComparisonResult {
  const result: ComparisonResult = {
    eq: {},
    diff: {},
    same_sku: {},
    raw,
  };

  const skus = new Set([...Object.keys(xlsxData), ...Object.keys(xmlData)]);

  for (const prod of skus) {
    const prod_pl = xlsxData[prod];
    const prod_nfe = xmlData[prod];

    console.log("prod_nfe.ids", prod_nfe?.ids);
    if (result.same_sku[prod] == null) result.same_sku[prod] = [];
    result.same_sku[prod] = prod_nfe?.ids;

    if (
      prod_pl?.[0] === prod_nfe?.res[0] &&
      Math.abs(prod_pl?.[1] - prod_nfe?.res[1]) < 0.0001
    )
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
