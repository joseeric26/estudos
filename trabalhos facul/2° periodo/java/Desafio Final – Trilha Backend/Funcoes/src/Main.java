public class Main {

    public static void main(String[] args) {

        // Valor da compra
        double valor = 150.00;

        // Criando um objeto de cada tipo
        FormaDePagamento pix = new PagamentoPix();

        FormaDePagamento debito =
                new PagamentoDebito(100.00);

        FormaDePagamento credito =
                new PagamentoCredito(500.00);


        // =========================
        // PAGAMENTO PIX
        // =========================

        System.out.println("############################");
        System.out.println("        PAGAMENTO PIX");
        System.out.println("############################");

        pix.pagar(valor);
        pix.exibirDetalhes();


        // =========================
        // PAGAMENTO DÉBITO
        // =========================

        System.out.println("\n############################");
        System.out.println("       PAGAMENTO DÉBITO");
        System.out.println("############################");

        debito.pagar(valor);
        debito.exibirDetalhes();


        // =========================
        // PAGAMENTO CRÉDITO
        // =========================

        System.out.println("\n############################");
        System.out.println("      PAGAMENTO CRÉDITO");
        System.out.println("############################");

        credito.pagar(valor);
        credito.exibirDetalhes();
    }
}