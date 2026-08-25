import java.util.ArrayList;

public class Pessoa {
    //seta atributos
    private String nome;
    private int idade;
    private String email;
    //funções
    public Pessoa(String nome, int idade, String email) {
        this.nome = nome;
        this.idade = idade;
    }

    public Pessoa() {

    }

    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public int getIdade() {
        return idade;
    }
    public void setIdade(int idade) {
        this.idade = idade;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public static void main(String[] args) {
        Pessoa Ronaldo = new Pessoa();

        Ronaldo.setNome("Ronaldo");
        Ronaldo.setEmail("roniprofissa0@gmail.com");
        Ronaldo.setIdade(16);

        Pessoa Ronalda = new Pessoa();

        Ronaldo.setNome("Ronalda");
        Ronaldo.setEmail("minaprofissa1@gmail.com");
        Ronaldo.setIdade(17);

        Pessoa Tonaldo = new Pessoa();

        Ronaldo.setNome("Tonaldo");
        Ronaldo.setEmail("toniprofissa2@gmail.com");
        Ronaldo.setIdade(18);

        for (Pessoa pessoa: new Pessoa[]{Ronaldo, Ronalda, Tonaldo}) {
            System.out.println(pessoa.getNome() + " tem " + pessoa.getIdade() + " e e-mail " + pessoa.getEmail());
        }
        for (Pessoa pessoa: new Pessoa[]{Ronaldo, Ronalda, Tonaldo}) {
            //condição relacionada a idade
            if (Ronaldo.getIdade() > Ronalda.getIdade() && Ronaldo.getIdade() > Tonaldo.getIdade() ) {
                System.out.println("Ronaldo é mais velho");
            } else if (Tonaldo.getIdade() > Ronaldo.getIdade() && Tonaldo.getIdade() > Ronalda.getIdade()) {
                System.out.println("Ronalda é mais velho");
            }else {
                System.out.println("Tonaldo é mais velho");
            }
        }
    }
}