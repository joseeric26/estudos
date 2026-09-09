public class PagamentoDebito extends FormaDePagamento {

    private double saldo;

    public PagamentoDebito(double saldo) {

        super(
                "Débito",
                "Pagamento utilizando saldo disponível",
                "DÉBITO"
        );

        this.saldo = saldo;
    }

    @Override
    public void pagar(double valor) {

        // Primeiro valida o valor
        if (!validarValor(valor)) {
            return;
        }

        // Depois verifica o saldo
        if (valor > saldo) {

            status = "Recusado";

            System.out.println(
                    "Pagamento recusado: saldo insuficiente."
            );

            System.out.println(
                    "Saldo disponível: R$ " + saldo
            );

            return;
        }

        this.valor = valor;

        // Desconta o valor do saldo
        saldo -= valor;

        // API de exemplo
        /*
         * POST https://api.exemplo.com/pagamentos/debito
         *
         * {
         *     "metodo": "DEBITO",
         *     "valor": 150.00
         * }
         */

        status = "Aprovado";

        System.out.println("Pagamento no débito aprovado!");
        System.out.println("Saldo restante: R$ " + saldo);
    }

    @Override
    public void exibirDetalhes() {

        System.out.println("\n===== DETALHES DO DÉBITO =====");
        System.out.println("Tipo: " + metodo);
        System.out.println("Valor: R$ " + valor);
        System.out.println("Status: " + status);
        System.out.println("Saldo restante: R$ " + saldo);
        System.out.println("Característica: Utiliza saldo disponível");
    }
}