import java.util.ArrayList;

public class DesafioLista {
    //seta atributos
    private String nome;
    //funções
    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public static void main(String[] args) {
        ArrayList<String> nomes = new
                ArrayList<>();
        nomes.add("banana");
        nomes.add("Batata");
        nomes.add("cenoura");     // adiciona
        nomes.get(0);         // "Ana"
        nomes.size();         // 2
        nomes.remove(0);
        for (String nome : nomes) {
            System.out.println(nome);
        }
        ArrayList<Integer> nums = new ArrayList<>();
        nums.add(10);   // autoboxing: 10 vira Integer
    }
}
