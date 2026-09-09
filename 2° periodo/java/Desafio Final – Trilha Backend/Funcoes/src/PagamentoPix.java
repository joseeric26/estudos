public class PagamentoPix extends FormaDePagamento {

    public PagamentoPix() {
        super(
                "PIX",
                "Pagamento instantâneo",
                "PIX"
        );
    }

    @Override
    public void pagar(double valor) {

        // Validação antes de processar
        if (!validarValor(valor)) {
            return;
        }

        this.valor = valor;

        // API de exemplo
        /*
         * POST https://api.exemplo.com/pagamentos/pix
         *
         * {
         *     "metodo": "PIX",
         *     "valor": 150.00
         * }
         */

        status = "Aprovado";

        System.out.println("Pagamento PIX aprovado!");
    }

    @Override
    public void exibirDetalhes() {

        System.out.println("\n===== DETALHES DO PIX =====");
        System.out.println("Tipo: " + metodo);
        System.out.println("Valor: R$ " + valor);
        System.out.println("Status: " + status);
        System.out.println("Característica: Pagamento instantâneo");
    }
}