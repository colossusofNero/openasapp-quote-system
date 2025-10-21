"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuotes, useDeleteQuote } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export default function QuotesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: quotesResponse, isLoading } = useQuotes({
    search: search || undefined,
    status: status || undefined,
    sortBy: sortBy as any,
    sortOrder,
  });

  const deleteQuote = useDeleteQuote();

  const quotes = quotesResponse?.data?.quotes || [];

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      deleteQuote.mutate(id);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "sent":
        return "warning";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your cost segregation quotes
          </p>
        </div>
        <Link href="/quotes/new">
          <Button size="lg">Create New Quote</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your quotes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by client name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Date Updated</option>
              <option value="bidAmount">Bid Amount</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Quotes ({quotes.length})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              Sort: {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || status ? "No quotes match your filters" : "No quotes yet"}
              </p>
              <Link href="/quotes/new">
                <Button>Create Your First Quote</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote: any) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {quote.propertyOwnerName}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={quote.propertyAddress}>
                          {quote.propertyAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{quote.quoteType}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quote.bidAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateShort(quote.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/quotes/${quote.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quote.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
