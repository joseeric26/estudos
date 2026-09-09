public abstract class FormaDePagamento {

    protected String nome;
    protected String descricao;
    protected String metodo;
    protected double valor;
    protected String status;

    public FormaDePagamento(String nome, String descricao, String metodo) {
        this.nome = nome;
        this.descricao = descricao;
        this.metodo = metodo;
        this.status = "Não processado";
    }

    // Cada tipo de pagamento deverá implementar seu próprio pagar()
    public abstract void pagar(double valor);

    // Cada tipo também poderá exibir seus detalhes de maneira diferente
    public abstract void exibirDetalhes();

    // Validação comum para todos os pagamentos
    protected boolean validarValor(double valor) {

        if (valor <= 0) {
            System.out.println(
                    "Pagamento recusado: o valor deve ser maior que zero."
            );

            status = "Recusado";
            return false;
        }

        return true;
    }
}