import { useEffect, useMemo, useState } from 'react'
import { customerDependencies } from '../../../customers/dependencies'

export const useReceivableCustomerContacts = (customerIds: number[]) => {
  const [phones, setPhones] = useState<Record<number, string | null>>({})
  const uniqueCustomerIds = useMemo(() => Array.from(new Set(customerIds)), [customerIds])

  useEffect(() => {
    const uniqueIds = uniqueCustomerIds.filter((id) => !Object.hasOwn(phones, id))
    if (uniqueIds.length === 0) {
      return
    }

    const fetchContacts = async () => {
      const customers = await Promise.all(
        uniqueIds.map(async (customerId) => {
          try {
            return await customerDependencies.getCustomerByIdUseCase.execute(customerId)
          } catch {
            return null
          }
        }),
      )

      setPhones((currentPhones) => {
        const nextPhones = { ...currentPhones }
        customers.forEach((customer) => {
          if (customer) {
            nextPhones[customer.id] = customer.phone
          }
        })
        return nextPhones
      })
    }

    void fetchContacts()
  }, [phones, uniqueCustomerIds])

  return phones
}
