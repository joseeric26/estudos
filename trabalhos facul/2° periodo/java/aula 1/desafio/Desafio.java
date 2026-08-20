package desafio;

public class Desafio {
//seta atributos
    private String nome;
    private int nivel;
    private double vida;
    private Boolean chefe;
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
    public double getVida() {
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
//declarar personagem
    public static void main(String[] args) {
        System.out.println("Hello World"); // escrave hello word
        Desafio Ronaldo = new Desafio();

        Ronaldo.setNome("Ronaldo");
        Ronaldo.setNivel(20);
        Ronaldo.setVida(200);
        Ronaldo.setChefe(true);
        for (Desafio personagem: new Desafio[]{Ronaldo}) {
            System.out.println( "%s é nivel %n e chega a %v de vida" + Ronaldo.getNome() + Ronaldo.getNivel() + Ronaldo.getVida() + Ronaldo.getChefe());
        }
    }
}