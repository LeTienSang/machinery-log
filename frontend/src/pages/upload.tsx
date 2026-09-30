import { useState, type FormEvent } from 'react'
import { Upload, FileImage } from 'lucide-react'
import { processOcrLog, batchSaveDailyLogs, getContracts, getEquipment } from '@/lib/api'
import { compressForOCR } from '@/utils/compressImage'
import { useToast } from '@/components/ui/toast'
import { Button, Input, Select, FormField, Textarea, Card } from '@/components/ui/primitives'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { useQuery } from '@tanstack/react-query'
import type { DailyLog } from '@/lib/types'

export function UploadPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [contractId, setContractId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10))
  const [draft, setDraft] = useState<DailyLog | null>(null)
  const [step, setStep] = useState<'form' | 'ocr' | 'submitted'>('form')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [compressLoading, setCompressLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const { data: contractsPage } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts({ status: 'ACTIVE' }),
  })
  const { data: equipmentPage } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => getEquipment(),
  })

  function handleFileChange(f: File | null) {
    setFile(f)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function handleOcr(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setOcrLoading(true)
    try {
      setCompressLoading(true)
      let uploadFile = file
      try {
        uploadFile = await compressForOCR(file)
      } catch {
        toast('Không nén được ảnh, dùng ảnh gốc để gửi.', 'error')
      } finally {
        setCompressLoading(false)
      }
      const result = await processOcrLog(
        uploadFile,
        contractId ? Number(contractId) : null,
        equipmentId ? Number(equipmentId) : null,
        workDate || null,
      )
      setDraft(result)
      setStep('ocr')
      toast('OCR hoàn tất. Kiểm tra và chỉnh sửa dữ liệu trước khi gửi.', 'success')
    } catch {
      toast('Không thể xử lý ảnh nhật ký. Kiểm tra file và kết nối máy chủ.', 'error')
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    setSaveLoading(true)
    try {
      await batchSaveDailyLogs([draft])
      setStep('submitted')
      toast('Nhật ký đã được gửi, đang chờ Kế toán duyệt.', 'success')
    } catch {
      toast('Không thể lưu nhật ký. Vui lòng thử lại.', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  function updateDraft(field: keyof DailyLog, value: string) {
    setDraft((cur) =>
      cur
        ? {
            ...cur,
            [field]: ['operatingHours', 'standbyHours'].includes(field) ? Number(value) : value,
          }
        : cur,
    )
  }

  if (step === 'submitted') {
    return (
      <AppShell>
        <PageHeader title="Upload nhật ký" />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
            <Upload size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Đã gửi thành công!</h2>
          <p className="mb-6 text-sm text-gray-500">Nhật ký đang chờ Kế toán duyệt.</p>
          <Button
            onClick={() => {
              setStep('form')
              setFile(null)
              setPreview(null)
              setDraft(null)
              setContractId('')
              setEquipmentId('')
            }}
          >
            Upload nhật ký mới
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Upload nhật ký" breadcrumbs={[{ label: 'Upload nhật ký' }]} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Upload form */}
        <Card>
          <div className="border-b border-gray-100 px-6 py-4">
            <span className="text-xs font-bold tracking-wider text-blue-600">BƯỚC 01</span>
            <h2 className="mt-1 text-base font-semibold text-gray-900">Chọn ảnh và thông tin</h2>
          </div>
          <form onSubmit={(e) => void handleOcr(e)} className="flex flex-col gap-4 p-6">
            <FormField label="Hợp đồng (không bắt buộc)" htmlFor="contract-id">
              <Select
                id="contract-id"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
              >
                <option value="">— Chọn hợp đồng —</option>
                {contractsPage?.content.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} — {c.projectName ?? c.constructionSite ?? ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Thiết bị (không bắt buộc)" htmlFor="equipment-id">
              <Select
                id="equipment-id"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
              >
                <option value="">— Chọn thiết bị —</option>
                {equipmentPage?.content.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.equipmentName} — {eq.serialRegistrationNumber}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Ngày làm việc (không bắt buộc)" htmlFor="work-date">
              <Input
                id="work-date"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              />
            </FormField>

            <FormField label="Ảnh nhật ký" htmlFor="log-file" required>
              <label
                htmlFor="log-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50"
              >
                <FileImage size={32} className="text-gray-400" />
                <span>{file ? file.name : '📷 Chạm để chụp / chọn ảnh'}</span>
                <span className="text-xs">JPG, PNG, HEIC — tối đa 10MB</span>
              </label>
              <input
                id="log-file"
                type="file"
                accept="image/jpeg,image/png,image/heic"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                required
              />
            </FormField>

            {preview && (
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            )}

            <Button type="submit" size="lg" loading={ocrLoading} className="mt-2 w-full">
              {compressLoading ? 'Đang nén ảnh...' : ocrLoading ? 'Đang đọc dữ liệu OCR...' : 'Đọc dữ liệu từ ảnh'}
            </Button>
          </form>
        </Card>

        {/* Step 2: Review OCR result */}
        <Card>
          <div className="border-b border-gray-100 px-6 py-4">
            <span className="text-xs font-bold tracking-wider text-blue-600">BƯỚC 02</span>
            <h2 className="mt-1 text-base font-semibold text-gray-900">Kiểm tra và gửi</h2>
            <p className="text-sm text-gray-500">Dữ liệu OCR có thể chỉnh sửa trước khi gửi.</p>
          </div>
          <div className="p-6">
            {!draft ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-gray-400">
                <FileImage size={40} className="mb-2 text-gray-300" />
                Kết quả OCR sẽ hiển thị tại đây sau bước 01.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Giờ vận hành" htmlFor="d-hours">
                    <Input
                      id="d-hours"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.operatingHours}
                      onChange={(e) => updateDraft('operatingHours', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Giờ chờ" htmlFor="d-standby">
                    <Input
                      id="d-standby"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.standbyHours}
                      onChange={(e) => updateDraft('standbyHours', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ca sáng: Bắt đầu" htmlFor="d-ms">
                    <Input id="d-ms" type="time" value={draft.morningStartTime ?? ''} onChange={(e) => updateDraft('morningStartTime', e.target.value)} />
                  </FormField>
                  <FormField label="Ca sáng: Kết thúc" htmlFor="d-me">
                    <Input id="d-me" type="time" value={draft.morningEndTime ?? ''} onChange={(e) => updateDraft('morningEndTime', e.target.value)} />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ca chiều: Bắt đầu" htmlFor="d-as">
                    <Input id="d-as" type="time" value={draft.afternoonStartTime ?? ''} onChange={(e) => updateDraft('afternoonStartTime', e.target.value)} />
                  </FormField>
                  <FormField label="Ca chiều: Kết thúc" htmlFor="d-ae">
                    <Input id="d-ae" type="time" value={draft.afternoonEndTime ?? ''} onChange={(e) => updateDraft('afternoonEndTime', e.target.value)} />
                  </FormField>
                </div>
                <FormField label="Người vận hành" htmlFor="d-operator">
                  <Input id="d-operator" value={draft.operatorName ?? ''} onChange={(e) => updateDraft('operatorName', e.target.value)} />
                </FormField>
                <FormField label="Mô tả công việc" htmlFor="d-desc">
                  <Textarea
                    id="d-desc"
                    rows={4}
                    value={draft.workDescription ?? ''}
                    onChange={(e) => updateDraft('workDescription', e.target.value)}
                  />
                </FormField>

                <Button size="lg" loading={saveLoading} onClick={() => void handleSave()} className="w-full">
                  {saveLoading ? 'Đang gửi...' : 'Gửi nhật ký chờ duyệt'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
