import { createContext, ReactNode, useContext, useState } from "react"
import { toast } from "react-toastify"
import { api } from "../services/api"
import { Product, Stock, ProductAPI } from "../types"

interface CartProviderProps {
	children: ReactNode
}

interface UpdateProductAmount {
	productId: number
	amount: number
}

interface CartContextData {
	cart: Product[]
	addProduct: (productId: number) => Promise<void>
	removeProduct: (productId: number) => void
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem("@RocketShoes:cart")

		if (storagedCart) return JSON.parse(storagedCart)

		return []
	})

  const validateStock = async (id: number, quatidade: number) => {
    const stock = await api.get<Stock>(`/stock/${id}`)
    const product = stock.data

    if (product.amount < quatidade) {
      toast.error('Quantidade solicitada fora de estoque');
      return false
    }

    return true
  }

	const addProduct = async (productId: number) => {
		try {
      const res = await api.get<ProductAPI>(`/products/${productId}`)
      const targetProduct = cart.find((p) => p.id === productId) ?? { ...res.data, amount: 0 }

      if (!(await validateStock(productId, targetProduct.amount + 1))) return
      targetProduct.amount += 1

      
      const tempCard = cart.filter(e => e.id !== productId)
			const newCart = [...tempCard, targetProduct]

			localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
			setCart(newCart)
		} catch {
			toast.error("Erro na adição do produto")
		}
	}

	const removeProduct = (productId: number) => {
		try {
			const newCart = cart.filter((product) => product.id !== productId)
			setCart(newCart)
			localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
		} catch {
			toast.error("Erro na remoção do produto")
		}
	}

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
      const res = await api.get<ProductAPI>(`/products/${productId}`)
      const targetProduct = cart.find((p) => p.id === productId) ?? { ...res.data, amount: 0 }

      if (!(await validateStock(productId, amount))) return
      targetProduct.amount = amount

      
      const tempCard = cart.filter(e => e.id !== productId)
			const newCart = [...tempCard, targetProduct]

			localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
			setCart(newCart)
		} catch {
      toast.error('Erro na alteração de quantidade do produto');
		}
	}

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	)
}

export function useCart(): CartContextData {
	const context = useContext(CartContext)

	return context
}
