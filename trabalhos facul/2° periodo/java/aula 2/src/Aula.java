public class Aula {
    //seta atributos
    private String nome;
    private int nivel;
    private double vida;
    private Boolean chefe;
    private int idade;
    //permite armezenar varios personagens
    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public int getNivel() {
        return nivel;
    }
    public void setNivel(int nivel) {
        this.nivel = nivel;
    }
    public double setVida() {
        return vida;
    }
    public void setVida(double vida) {
        this.vida = vida;
    }
    public Boolean getChefe() {
        return chefe;
    }
    public void setChefe(Boolean chefe) {
        this.chefe = chefe;
    }
    public int getIdade() {
        return idade;
    }
    public void setIdade(int idade) {
        this.idade = idade;
    }
    //declarar personagem
    public static void main(String[] args) {
        System.out.println("Hello World"); // escrave hello word
        Aula Ronaldo = new Aula();

        Ronaldo.setNome("Ronaldo");
        Ronaldo.setNivel(20);
        Ronaldo.setVida(20.0);
        Ronaldo.setChefe(true);
        Ronaldo.setIdade(18);
        for (Aula personagem: new Aula[]{Ronaldo}) {
            System.out.println( "%s é nivel %n e chega a %v de vida" + Ronaldo.getNome() + Ronaldo.getNivel() + Ronaldo.setVida());
            //condição relacionada a idade
            if (personagem.idade >= 18) {
                System.out.println("Liberado");
            } else {
                System.out.println("Negado");
            }
        }
    }
}
