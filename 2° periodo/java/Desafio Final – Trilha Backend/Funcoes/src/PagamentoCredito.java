public class PagamentoCredito extends FormaDePagamento {

    private double limite;

    public PagamentoCredito(double limite) {

        super(
                "Crédito",
                "Pagamento utilizando limite de crédito",
                "CRÉDITO"
        );

        this.limite = limite;
    }

    @Override
    public void pagar(double valor) {

        // Primeiro valida o valor
        if (!validarValor(valor)) {
            return;
        }

        // Verifica o limite
        if (valor > limite) {

            status = "Recusado";

            System.out.println(
                    "Pagamento recusado: limite insuficiente."
            );

            System.out.println(
                    "Limite disponível: R$ " + limite
            );

            return;
        }

        this.valor = valor;

        // Utiliza parte do limite
        limite -= valor;

        // API de exemplo
        /*
         * POST https://api.exemplo.com/pagamentos/credito
         *
         * {
         *     "metodo": "CREDITO",
         *     "valor": 150.00
         * }
         */

        status = "Aprovado";

        System.out.println("Pagamento no crédito aprovado!");
        System.out.println("Limite restante: R$ " + limite);
    }

    @Override
    public void exibirDetalhes() {

        System.out.println("\n===== DETALHES DO CRÉDITO =====");
        System.out.println("Tipo: " + metodo);
        System.out.println("Valor: R$ " + valor);
        System.out.println("Status: " + status);
        System.out.println("Limite restante: R$ " + limite);
        System.out.println("Característica: Utiliza limite de crédito");
    }
}