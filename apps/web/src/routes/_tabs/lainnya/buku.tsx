import { createFileRoute } from "@tanstack/react-router"
import { BooksPage } from "@/pages/books/BooksPage"

export const Route = createFileRoute("/_tabs/lainnya/buku")({ component: BooksPage })
