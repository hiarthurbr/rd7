'use client'

import { useState, useCallback } from 'react'
import { FileUploader } from '@/components/file-uploader'
import { ResultsList } from '@/components/results-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { parseXlsx, parseXml, compareFiles } from '@/lib/compare-files'
import type { ComparisonResult } from '@/lib/types'
import { ArrowRight, FileSearch, RotateCcw } from 'lucide-react'

export default function Dashboard() {
  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = useCallback(async () => {
    if (!xlsxFile || !xmlFile) return

    setIsProcessing(true)
    setError(null)

    try {
      // Processa o arquivo XLSX
      const xlsxBuffer = await xlsxFile.arrayBuffer()
      const xlsxData = await parseXlsx(xlsxBuffer)

      // Processa o arquivo XML
      const xmlText = await xmlFile.text()
      const xmlData = parseXml(xmlText)

      // Compara os dados
      const comparisonResult = compareFiles(xlsxData, xmlData)
      setResults(comparisonResult)
    } catch (err) {
      console.error('[v0] Erro ao processar arquivos:', err)
      setError('Erro ao processar os arquivos. Verifique se os formatos estão corretos.')
    } finally {
      setIsProcessing(false)
    }
  }, [xlsxFile, xmlFile])

  const handleReset = useCallback(() => {
    setXlsxFile(null)
    setXmlFile(null)
    setResults(null)
    setError(null)
  }, [])

  const canCompare = xlsxFile && xmlFile && !isProcessing

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Comparador de Arquivos
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Compare arquivos XLSX e XML para identificar divergências de produtos
          </p>
        </div>

        {!results ? (
          <>
            {/* Upload Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="size-5" />
                  Upload de Arquivos
                </CardTitle>
                <CardDescription>
                  Selecione um arquivo Excel (.xlsx) com os dados esperados e um arquivo XML com os dados recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Dados Esperados (XLSX)</p>
                    <FileUploader
                      label="Arquivo Excel (.xlsx)"
                      accept=".xlsx,.xls"
                      file={xlsxFile}
                      onFileChange={setXlsxFile}
                      icon="xlsx"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Dados Recebidos (XML)</p>
                    <FileUploader
                      label="Arquivo XML (.xml)"
                      accept=".xml"
                      file={xmlFile}
                      onFileChange={setXmlFile}
                      icon="xml"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleCompare}
                    disabled={!canCompare}
                    className="min-w-[200px]"
                  >
                    {isProcessing ? (
                      <>
                        <Spinner className="size-4" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Comparar Arquivos
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Resultado da Comparação</h2>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="size-4" />
                Nova Comparação
              </Button>
            </div>

            <ResultsList results={results} />
          </>
        )}
      </div>
    </main>
  )
}
