import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { Button, Input, FormField, Modal, Card } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Customer } from '@/lib/types'

function CustomerForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Customer>
  onSubmit: (data: Omit<Customer, 'id'>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    companyName: initial?.companyName ?? '',
    taxCode: initial?.taxCode ?? '',
    representativeName: initial?.representativeName ?? '',
    position: initial?.position ?? '',
    phoneNumber: initial?.phoneNumber ?? '',
    address: initial?.address ?? '',
  })
  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tên công ty" required>
        <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required />
      </FormField>
      <FormField label="Mã số thuế">
        <Input value={form.taxCode} onChange={(e) => set('taxCode', e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Người đại diện">
          <Input value={form.representativeName} onChange={(e) => set('representativeName', e.target.value)} />
        </FormField>
        <FormField label="Chức vụ">
          <Input value={form.position} onChange={(e) => set('position', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Số điện thoại">
        <Input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} />
      </FormField>
      <FormField label="Địa chỉ">
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button loading={loading} onClick={() => onSubmit(form)}>Lưu</Button>
      </div>
    </div>
  )
}

export function CustomersPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Customer | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search || undefined),
  })

  const createMut = useMutation({
    mutationFn: (body: Omit<Customer, 'id'>) => createCustomer(body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); toast('Đã thêm khách hàng.', 'success') },
    onError: () => toast('Không thể thêm khách hàng.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Omit<Customer, 'id'> }) => updateCustomer(id, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); toast('Đã cập nhật khách hàng.', 'success') },
    onError: () => toast('Không thể cập nhật khách hàng.', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); toast('Đã xóa khách hàng.', 'success') },
    onError: () => toast('Không thể xóa khách hàng (có thể còn hợp đồng liên quan).', 'error'),
  })

  const customers = data?.content ?? []

  return (
    <AppShell>
      <PageHeader
        title="Khách hàng"
        actions={
          <Button onClick={() => { setEditing(null); setModal('create') }}>
            <Plus size={16} /> Thêm khách hàng
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : customers.length === 0 ? (
        <EmptyState
          title="Chưa có khách hàng nào"
          description="Thêm khách hàng đầu tiên để bắt đầu."
          action={<Button onClick={() => setModal('create')}><Plus size={16} /> Thêm khách hàng</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Tên công ty</th>
                <th className="px-4 py-3 text-left">MST</th>
                <th className="px-4 py-3 text-left">Người đại diện</th>
                <th className="px-4 py-3 text-left">Điện thoại</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.companyName}</td>
                  <td className="px-4 py-3 text-gray-500">{c.taxCode ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.representativeName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phoneNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Sửa"
                        onClick={() => { setEditing(c); setModal('edit') }}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Xóa"
                        onClick={() => { if (confirm('Xóa khách hàng này?')) deleteMut.mutate(c.id) }}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Thêm khách hàng">
        <CustomerForm
          onSubmit={(body) => createMut.mutate(body)}
          loading={createMut.isPending}
        />
      </Modal>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Sửa khách hàng">
        {editing && (
          <CustomerForm
            initial={editing}
            onSubmit={(body) => updateMut.mutate({ id: editing.id, body })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </AppShell>
  )
}
